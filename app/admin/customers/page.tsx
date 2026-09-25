import { redirect } from 'next/navigation'; import { createClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function CustomersAdmin(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/admin/login');
 const {data:me}=await supabase.from('profiles').select('role').eq('id',user.id).single(); if(me?.role!=='admin')redirect('/admin/login');
 const {data:customers}=await supabase.from('profiles').select('id,email,full_name,phone,created_at').eq('role','customer').order('created_at',{ascending:false});
 return <main className="container" style={{padding:'40px 0'}}><p><a href="/admin">← Dashboard</a></p><h1>Customer management</h1><div style={{display:'grid',gap:12}}>{customers?.map((c:any)=><div className="card" key={c.id}><h3>{c.full_name||'Unnamed customer'}</h3><p>{c.email}</p><p>{c.phone||'No phone provided'}</p><small>Joined {new Date(c.created_at).toLocaleString()}</small></div>)}{!customers?.length&&<p>No customers found.</p>}</div></main>;
}
