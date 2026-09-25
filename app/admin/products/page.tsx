import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

async function saveProduct(formData: FormData) {
  'use server';
  const supabase = await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect('/admin/login');
  const {data:me}=await supabase.from('profiles').select('role').eq('id',user.id).single();
  if(me?.role!=='admin') redirect('/admin/login');
  const id=String(formData.get('id')||''), name=String(formData.get('name')||'').trim(), description=String(formData.get('description')||'').trim();
  const price=Number(formData.get('price_ngn')||0), image_url=String(formData.get('image_url')||'').trim()||null, active=formData.get('active')==='on';
  if(!name||!Number.isInteger(price)||price<0)return;
  const payload={name,description:description||null,price_ngn:price,image_url,active};
  if(id) await supabase.from('products').update(payload).eq('id',id); else await supabase.from('products').insert(payload);
  revalidatePath('/admin/products'); revalidatePath('/');
}
async function deleteProduct(formData:FormData){
  'use server'; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/admin/login');
  const {data:me}=await supabase.from('profiles').select('role').eq('id',user.id).single(); if(me?.role!=='admin')redirect('/admin/login');
  await supabase.from('products').delete().eq('id',String(formData.get('id'))); revalidatePath('/admin/products'); revalidatePath('/');
}
export default async function ProductsAdmin(){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/admin/login');
  const {data:me}=await supabase.from('profiles').select('role').eq('id',user.id).single(); if(me?.role!=='admin')redirect('/admin/login');
  const {data:products}=await supabase.from('products').select('*').order('created_at',{ascending:false});
  return <main className="container" style={{padding:'40px 0'}}><p><a href="/admin">← Dashboard</a></p><h1>Product management</h1>
    <form action={saveProduct} className="card" style={{display:'grid',gap:10,maxWidth:700}}><input name="name" required placeholder="Product name"/><textarea name="description" placeholder="Description"/><input name="price_ngn" required type="number" min="0" placeholder="Price in NGN"/><input name="image_url" type="url" placeholder="Image URL (optional)"/><label><input name="active" type="checkbox" defaultChecked/> Active</label><button className="btn primary">Add product</button></form>
    <div style={{display:'grid',gap:12,marginTop:24}}>{products?.map((p:any)=><div className="card" key={p.id}><strong>{p.name}</strong> — ₦{Number(p.price_ngn).toLocaleString()} — {p.active?'Active':'Hidden'}<p>{p.description}</p>
      <form action={saveProduct} style={{display:'grid',gap:8}}><input type="hidden" name="id" value={p.id}/><input name="name" defaultValue={p.name} required/><input name="description" defaultValue={p.description||''}/><input name="price_ngn" type="number" min="0" defaultValue={p.price_ngn} required/><input name="image_url" defaultValue={p.image_url||''}/><label><input name="active" type="checkbox" defaultChecked={p.active}/> Active</label><button className="btn secondary">Save</button></form>
      <form action={deleteProduct} style={{marginTop:8}}><input type="hidden" name="id" value={p.id}/><button className="btn secondary">Delete</button></form></div>)}</div></main>;
}
