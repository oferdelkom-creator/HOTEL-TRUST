import {createClient} from '@/lib/supabase/server';
import {categories,guestLanguages,providerNames} from '@/lib/support';
export const dynamic='force-dynamic';
const tables={knowledge:'hotel_support_knowledge',request:'hotel_support_requests',connection:'hotel_support_connections'} as const;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const str=(v:unknown,max:number,min=0):v is string=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
const json=(b:unknown,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'private, no-store'}});
async function context(hotelId:unknown){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user||!user.email_confirmed_at||user.is_anonymous)return {error:json({error:'Sign in with a confirmed account.'},401)};
 if(!uuid(hotelId))return {error:json({error:'Choose a valid hotel.'},400)};
 const {data:hotel,error}=await db.from('hotels').select('id').eq('id',hotelId).eq('owner_id',user.id).maybeSingle();
 if(error)return {error:json({error:'Could not verify hotel access.'},503)};
 if(!hotel)return {error:json({error:'Hotel not found in your account.'},404)};
 return {db,hotelId:hotel.id};
}
export async function GET(request:Request){
 const c=await context(new URL(request.url).searchParams.get('hotelId'));if(c.error)return c.error;
 const results=await Promise.all(Object.values(tables).map(t=>c.db.from(t).select('*').eq('hotel_id',c.hotelId).order('created_at',{ascending:false}).limit(500)));
 if(results.some(r=>r.error))return json({error:'The support workspace could not be loaded. Please try again.'},503);
 return json({knowledge:results[0].data,requests:results[1].data,connections:results[2].data});
}
async function write(request:Request,patch:boolean){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'This request must come from your hotel workspace.'},403);
 let b:Record<string,unknown>;try{const text=await request.text();if(text.length>16000)return json({error:'Request too large.'},413);b=JSON.parse(text);if(!b||Array.isArray(b)||typeof b!=='object')throw Error();}catch{return json({error:'Invalid request.'},400)}
 const c=await context(b.hotelId);if(c.error)return c.error;
 if(typeof b.kind!=='string'||!Object.hasOwn(tables,b.kind))return json({error:'Invalid action.'},400);
 const kind=b.kind as keyof typeof tables,table=tables[kind];
 let fields:Record<string,unknown>;
 if(patch){
  if(kind==='connection'||!uuid(b.id)||!Number.isSafeInteger(b.version)||Number(b.version)<1)return json({error:'Invalid update.'},400);
  if(kind==='knowledge'){if(typeof b.approved!=='boolean')return json({error:'Confirm information approval.'},400);fields={approved:b.approved};}
  else{if(!['open','in_progress','resolved'].includes(String(b.status))||!str(b.staff_notes,3000))return json({error:'Check the status and notes.'},400);fields={status:b.status,staff_notes:b.staff_notes.trim()};}
  const {data,error}=await c.db.from(table).update(fields).eq('id',b.id).eq('hotel_id',c.hotelId).eq('version',b.version).select('id').maybeSingle();
  if(error)return json({error:'Could not update the record.'},503);
  if(!data)return json({error:'This record changed. Refresh before trying again.'},409);
 }else{
  if(kind==='connection'){
   if(typeof b.provider!=='string'||!Object.hasOwn(providerNames,b.provider)||!str(b.reference,200))return json({error:'Choose a service and a short public reference.'},400);
   if(/https?:|sk-|bearer|password|token|secret/i.test(b.reference))return json({error:'Do not include credentials or private URLs.'},400);
   fields={provider:b.provider,reference:b.reference.trim()};
  }else{
   if(!str(b.body,3000,3)||!guestLanguages.includes(b.language as never)||!categories.includes(b.category as never))return json({error:'Check the message, language and category.'},400);
   if(kind==='knowledge'){if(!str(b.title,150,1)||typeof b.approved!=='boolean')return json({error:'Enter a title and check the approval.'},400);fields={title:b.title.trim(),body:b.body.trim(),language:b.language,category:b.category,approved:b.approved};}
   else{if(!str(b.guest_name,100)||!str(b.room,80))return json({error:'Check the guest and room fields.'},400);fields={guest_name:b.guest_name.trim(),room:b.room.trim(),body:b.body.trim(),language:b.language,category:b.category};}
  }
  const {error}=await c.db.from(table).insert({...fields,hotel_id:c.hotelId});
  if(error)return json({error:error.code==='23505'?'A connection request for this service already exists.':'Could not save the record.'},error.code==='23505'?409:503);
 }
 return json({ok:true});
}
export async function POST(r:Request){return write(r,false)}
export async function PATCH(r:Request){return write(r,true)}
