import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import VerificationActions from './VerificationActions';
import OperationsWorkspace from '@/components/OperationsWorkspace';
export const dynamic='force-dynamic';
export default async function Admin(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?next=/admin');
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();if(profile?.role!=='admin')redirect('/owner');
 const {data:hotels,error}=await db.from('hotels').select('id,name,city,country,verification_status,verification_proof_url').order('created_at',{ascending:false});
 if(error)return <div className="ht-wrap ht-section" role="alert">Could not load hotels.</div>;
 return <><OperationsWorkspace admin hotels={hotels??[]} accountId={user.id} reportDate={new Date().toISOString().slice(0,10)}/><section className="ht-wrap ht-section"><p className="ht-eyebrow">Platform admin</p><h2>Hotel verification</h2><p>Review hotel authority before activating any future live channel.</p>{hotels?.filter(h=>h.verification_status==='pending').map(h=><article key={h.id} className="ht-card"><h3>{h.name}</h3><p>{h.city}, {h.country}</p>{h.verification_proof_url?.startsWith('https://')&&<a className="ht-link" href={h.verification_proof_url} target="_blank" rel="noopener noreferrer">Public business listing ↗</a>}<VerificationActions hotelId={h.id}/></article>)}</section></>;
}

