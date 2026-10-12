import {createClient} from '@/lib/supabase/server';
import {languages,learningInstructions,learningSchema,scopedKnowledge,validateResult} from '@/lib/learning';
import type {RecordRow} from '@/lib/operations';
export const dynamic='force-dynamic';
export const maxDuration=90;
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
async function context(id:unknown){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user?.email_confirmed_at||user.is_anonymous)return {error:json({error:'Sign in with a confirmed account.'},401)};
 if(typeof id!=='string'||! /^[0-9a-f-]{36}$/i.test(id))return {error:json({error:'Choose a hotel.'},400)};
 const [{data:hotel},{data:profile},{data:member}]=await Promise.all([db.from('hotels').select('id,name,city,country,owner_id').eq('id',id).maybeSingle(),db.from('profiles').select('role').eq('id',user.id).maybeSingle(),db.from('ht_members').select('role').eq('hotel_id',id).eq('user_id',user.id).maybeSingle()]);
 if(!hotel||!(hotel.owner_id===user.id||profile?.role==='admin'||member?.role==='manager'))return {error:json({error:'Hotel manager access required.'},403)};
 return {db,user,hotel};
}
export async function GET(request:Request){
 const c=await context(new URL(request.url).searchParams.get('hotelId'));if(c.error)return c.error;
 const {data,error}=await c.db.from('ht_learning_runs').select('*').eq('hotel_id',c.hotel.id).order('created_at',{ascending:false}).limit(50);
 if(error)return json({error:'Could not load learning history.'},503);
 return json({configured:!!process.env.OPENAI_API_KEY,mode:'learning_drafts',model:process.env.OPENAI_MODEL??'gpt-5.4-mini',runs:data,qualification:{required:10000,passed:0,status:'Approved answer keys and independent hotel review required'},channels_connected:false});
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Use your HOTELTRUST workspace.'},403);
 let b:Record<string,unknown>;try{const body=await request.text();if(body.length>16000)return json({error:'Request too large.'},413);b=JSON.parse(body);if(!b||typeof b!=='object')throw Error();}catch{return json({error:'Invalid request.'},400)}
 const c=await context(b.hotelId);if(c.error)return c.error;
 if(!process.env.OPENAI_API_KEY)return json({error:'AI key has not been configured on this deployment.'},503);
 if(!['draft','analyse','research','test'].includes(String(b.action))||!languages.includes(b.language as typeof languages[number])||typeof b.question!=='string'||!b.question.trim()||b.question.length>4000)return json({error:'Choose an action, language and question (up to 4,000 characters).'},400);
 const {data:runId,error:reserveError}=await c.db.rpc('ht_reserve_learning_run',{target_hotel:c.hotel.id,task_action:b.action,task_language:b.language,task_question:b.question});
 if(reserveError)return json({error:'Learning limit reached (20 requests per hotel per hour), or a run could not be reserved.'},429);
 const started=Date.now();
 try{
  const records:RecordRow[]=[];for(let offset=0;offset<50000;offset+=1000){const {data,error}=await c.db.from('ht_records').select('*').eq('hotel_id',c.hotel.id).order('id').range(offset,offset+999);if(error)throw Error('Could not load hotel knowledge.');records.push(...(data??[]) as RecordRow[]);if((data?.length??0)<1000)break;if(offset===49000)throw Error('Hotel record limit exceeded.');}
  const conversationKey=typeof b.conversationKey==='string'?b.conversationKey:undefined;
  if(conversationKey&&!records.some(r=>r.kind==='conversation'&&r.external_key===conversationKey))throw Error('Conversation not found in this hotel.');
  const approved=scopedKnowledge(records,conversationKey).map(r=>({reference:r.external_key,scope:r.data.scope,scope_key:r.data.scope_key,language:r.data.language,title:r.data.title,body:r.data.body,version:r.version,expires_at:r.data.expires_at}));
  const analysis=b.action==='analyse'?records.filter(r=>r.kind==='review'||(r.kind==='message'&&r.data.delivery==='historical')).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100).map(r=>({kind:r.kind,body:r.data.body,score:r.data.score,direction:r.data.direction})):[];
  const thread=conversationKey?records.filter(r=>r.kind==='message'&&r.data.conversation_key===conversationKey).sort((a,b)=>String(a.data.sent_at).localeCompare(String(b.data.sent_at))).slice(-20).map(r=>({direction:r.data.direction,body:r.data.body})):[];
  const input=JSON.stringify({hotel:{name:c.hotel.name,city:c.hotel.city,country:c.hotel.country},action:b.action,language:b.language,question:b.question,approved_knowledge:approved,untrusted_history:analysis,untrusted_thread:thread});
  if(input.length>50000)throw Error('Selected knowledge is too large. Reduce the approved knowledge or use a specific conversation.');
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(75000),body:JSON.stringify({model:process.env.OPENAI_MODEL??'gpt-5.4-mini',store:false,instructions:learningInstructions,input,max_output_tokens:3500,text:{format:{type:'json_schema',name:'hotel_learning',strict:true,schema:learningSchema}},...(b.action==='research'?{tools:[{type:'web_search',filters:{allowed_domains:['hotelbelfastparis.com','ratp.fr','iledefrance-mobilites.fr','parisjetaime.com','paris.fr','parisaeroport.fr','sncf-connect.com']}}]}:{})})});
  if(!response.ok){const code=response.status;throw Error(code===401?'OpenAI rejected the key.':code===429?'OpenAI credit or rate limit reached.':code===403?'The key lacks permission for this model or action.':`OpenAI request failed (${code}).`);}
  const raw=await response.json();if(raw.status!=='completed')throw Error('AI did not complete this response.');
  const text=(raw.output??[]).flatMap((item:{content?:{type:string;text?:string}[]})=>item.content??[]).filter((item:{type:string})=>item.type==='output_text').map((item:{text?:string})=>item.text??'').join('');
  const result=validateResult(JSON.parse(text));
  const {error}=await c.db.from('ht_learning_runs').update({status:'completed',result,knowledge_snapshot:approved,usage:raw.usage??{},duration_ms:Date.now()-started}).eq('id',runId).eq('hotel_id',c.hotel.id);
  if(error)throw Error('AI answered but the run could not be saved.');return json({result,runId,qualification_passed:false});
 }catch(e){const message=e instanceof Error?e.message:'Learning failed.';await c.db.from('ht_learning_runs').update({status:'failed',error:message.slice(0,500)}).eq('id',runId).eq('hotel_id',c.hotel.id);return json({error:message},503);}
}
