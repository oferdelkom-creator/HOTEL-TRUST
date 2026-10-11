import {createClient} from '@/lib/supabase/server';
import {isKind,validKey,validateFields,validateReferences,type RecordRow} from '@/lib/operations';
export const dynamic='force-dynamic';
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function context(hotelId:unknown){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user||!user.email_confirmed_at||user.is_anonymous)return {error:json({error:'Sign in with a confirmed account.'},401)};
 if(!uuid(hotelId))return {error:json({error:'Choose a hotel.'},400)};
 const [{data:hotel,error},{data:profile},{data:membership}]=await Promise.all([db.from('hotels').select('id,owner_id').eq('id',hotelId).maybeSingle(),db.from('profiles').select('role').eq('id',user.id).maybeSingle(),db.from('ht_members').select('role').eq('hotel_id',hotelId).eq('user_id',user.id).maybeSingle()]);
 if(error)return {error:json({error:'Could not verify access.'},503)};
 if(!hotel||!(hotel.owner_id===user.id||profile?.role==='admin'||membership))return {error:json({error:'Hotel not found in your account.'},404)};
 return {db,hotelId:hotel.id,userId:user.id,manage:hotel.owner_id===user.id||profile?.role==='admin'||membership?.role==='manager',owner:hotel.owner_id===user.id||profile?.role==='admin'};
}
async function allRecords(db:NonNullable<Awaited<ReturnType<typeof context>>['db']>,hotelId:string){
 const records:RecordRow[]=[];for(let offset=0;offset<50000;offset+=1000){const {data,error}=await db.from('ht_records').select('*').eq('hotel_id',hotelId).order('id').range(offset,offset+999);if(error)throw Error('Could not load hotel records.');records.push(...(data??[]) as RecordRow[]);if((data?.length??0)<1000)return records;}throw Error('This hotel exceeds the current report limit (50,000 records). No partial report was produced.');
}
export async function GET(request:Request){const c=await context(new URL(request.url).searchParams.get('hotelId'));if(c.error)return c.error;try{const [records,{data:audit,error:ae},{data:members,error:me}]=await Promise.all([allRecords(c.db,c.hotelId),c.manage?c.db.from('ht_audit').select('id,record_id,actor_id,action,kind,created_at').eq('hotel_id',c.hotelId).order('created_at',{ascending:false}).limit(100):Promise.resolve({data:[],error:null}),c.db.from('ht_members').select('id,user_id,role,created_at').eq('hotel_id',c.hotelId)]);if(ae||me)throw Error('Could not load team or audit data.');return json({records,audit,members,manage:c.manage,owner:c.owner});}catch(e){return json({error:(e as Error).message},503)}}
async function write(request:Request,patch:boolean){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Use your HOTELTRUST workspace.'},403);
 let b:Record<string,unknown>;try{const text=await request.text();if(text.length>4_000_000)return json({error:'File too large.'},413);b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b))throw Error();}catch{return json({error:'Invalid request.'},400)}
 const c=await context(b.hotelId);if(c.error)return c.error;
 if(b.action==='member'){
  if(!c.owner)return json({error:'Only the owner or platform admin can manage access.'},403);
  if(!uuid(b.user_id)||!['manager','reception'].includes(String(b.role)))return json({error:'Use an existing account ID and a valid team role.'},400);
  const {error}=await c.db.from('ht_members').upsert({hotel_id:c.hotelId,user_id:b.user_id,role:b.role},{onConflict:'hotel_id,user_id'});return error?json({error:'Could not add this account. Confirm that the person has registered and supplied their account ID.'},400):json({ok:true});
 }
 if(b.action==='remove_member'){if(!c.owner)return json({error:'Only the owner or platform admin can manage access.'},403);if(!uuid(b.id))return json({error:'Invalid member.'},400);const {error}=await c.db.from('ht_members').delete().eq('id',b.id).eq('hotel_id',c.hotelId);return error?json({error:'Could not remove member.'},503):json({ok:true});}
 if(!isKind(b.kind))return json({error:'Invalid record type.'},400);const kind=b.kind;
 if(['room_type','room','knowledge','connection','settings'].includes(kind)&&!c.manage)return json({error:'Manager access required.'},403);
 try{
  const records=await allRecords(c.db,c.hotelId);
  if(b.action==='import'){
   if(!Array.isArray(b.rows)||!b.rows.length||b.rows.length>500)throw Error('Import 1–500 rows.');const keys=new Set<string>();
   const rows=b.rows.map((v:unknown)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid import row.');const r=v as Record<string,unknown>;if(!validKey(r.external_key)||keys.has(r.external_key))throw Error('Each row needs a unique reference.');keys.add(r.external_key);return {external_key:r.external_key,data:validateFields(kind,r.data)};});
   const candidates=[...records,...rows.map(r=>({...r,id:'',hotel_id:c.hotelId,kind,version:1,created_at:'',updated_at:''}))];for(const r of rows)validateReferences(kind,r.data,candidates);
   const {data,error}=await c.db.rpc('ht_import_records',{target_hotel:c.hotelId,record_kind:kind,items:rows});if(error)return json({error:'Import failed. No records in this batch were saved.'},503);return json({ok:true,inserted:data,skipped:rows.length-Number(data)});
  }
  if(!validKey(b.external_key))throw Error('Use a record reference of 1–120 letters, numbers or simple separators.');const data=validateFields(kind,b.data);validateReferences(kind,data,records);
  if(patch){if(!uuid(b.id)||!Number.isSafeInteger(b.version)||Number(b.version)<1)throw Error('Invalid update version.');const {data:updated,error}=await c.db.from('ht_records').update({data}).eq('id',b.id).eq('hotel_id',c.hotelId).eq('kind',kind).eq('external_key',b.external_key).eq('version',b.version).select('id').maybeSingle();if(error)return json({error:'Could not update record.'},503);if(!updated)return json({error:'This record changed. Refresh and try again.'},409);}
  else{if(kind==='settings'&&b.external_key!=='hotel')throw Error('Settings reference must be hotel.');const {error}=await c.db.from('ht_records').insert({hotel_id:c.hotelId,kind,external_key:b.external_key,data});if(error)return json({error:error.code==='23505'?'This reference already exists. Edit the existing record.':'Could not save record.'},error.code==='23505'?409:503);}
  return json({ok:true});
 }catch(e){return json({error:(e as Error).message},400)}
}
export async function POST(r:Request){return write(r,false)}
export async function PATCH(r:Request){return write(r,true)}
