import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import OperationsWorkspace from '@/components/OperationsWorkspace';
export const dynamic='force-dynamic';
export default async function Owner(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?next=/owner');
 const {data:members,error:memberError}=await db.from('ht_members').select('hotel_id').eq('user_id',user.id);
 if(memberError)return <div className="ht-wrap ht-section" role="alert">Could not load team access. Please refresh.</div>;
 const memberIds=(members??[]).map(m=>m.hotel_id);
 const query=db.from('hotels').select('id,name,city,country,verification_status');
 const {data:hotels,error}=await (memberIds.length?query.or(`owner_id.eq.${user.id},id.in.(${memberIds.join(',')})`):query.eq('owner_id',user.id)).order('created_at');
 if(error)return <div className="ht-wrap ht-section" role="alert"><h1>The workspace could not be loaded</h1><p>Please refresh and try again.</p></div>;
 return <OperationsWorkspace hotels={hotels??[]} accountId={user.id} reportDate={new Date().toISOString().slice(0,10)}/>;
}
