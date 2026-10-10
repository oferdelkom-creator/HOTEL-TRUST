import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import HotelWorkspace from '@/components/HotelWorkspace';
export const dynamic='force-dynamic';
export default async function Owner(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?next=/owner');
 const {data:hotels,error}=await db.from('hotels').select('id,name,city,country,verification_status').eq('owner_id',user.id).order('created_at');
 if(error)return <div className="ht-wrap ht-section" role="alert"><h1>The workspace could not be loaded</h1><p>Please refresh and try again.</p></div>;
 return <HotelWorkspace hotels={hotels??[]}/>;
}
