import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import VerificationActions from './VerificationActions';
export const dynamic='force-dynamic';
export default async function Admin(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?next=/admin');
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();if(profile?.role!=='admin')redirect('/owner');
 const {data:hotels,error}=await db.from('hotels').select('id,name,city,country,verification_status,verification_proof_url').order('created_at',{ascending:false});
 return <div className="ht-wrap ht-section"><p className="ht-eyebrow">Platform admin</p><h1 className="text-3xl mb-5">Hotel verification</h1><p className="mb-6">Verify hotel authority before reviewing live channel connections. Verification does not activate AI replies.</p>{error&&<p role="alert">Could not load hotel reviews.</p>}{!hotels?.length&&!error&&<p className="ht-card">No hotels submitted yet.</p>}{hotels?.map(h=><article key={h.id} className="ht-card"><h2>{h.name}</h2><p>{h.city}, {h.country} · {h.verification_status}</p>{h.verification_proof_url?.startsWith('https://')&&<a className="ht-link" href={h.verification_proof_url} target="_blank" rel="noopener noreferrer">Public business listing ↗</a>}{h.verification_status==='pending'&&<VerificationActions hotelId={h.id}/>}</article>)}</div>;
}
