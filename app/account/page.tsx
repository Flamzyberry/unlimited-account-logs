import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AccountPage({searchParams}:{searchParams:Promise<{funding?:string}>}) {
 const {funding}=await searchParams; const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/login');
 const {data:profile,error:profileError}=await supabase.from('profiles').select('email,full_name,phone,role,balance_ngn,created_at,account_status').eq('id',user.id).maybeSingle();
 if(profileError||!profile)redirect('/login?error=profile'); if(profile.role!=='customer')redirect('/admin/login'); if(profile.account_status==='suspended')redirect('/login?error=suspended');
 const [{count:totalOrders},{count:pendingOrders},{count:completedOrders},{data:history}]=await Promise.all([
  supabase.from('orders').select('*',{count:'exact',head:true}).eq('customer_id',user.id),
  supabase.from('orders').select('*',{count:'exact',head:true}).eq('customer_id',user.id).eq('status','pending'),
  supabase.from('orders').select('*',{count:'exact',head:true}).eq('customer_id',user.id).eq('status','completed'),
  supabase.from('wallet_transactions').select('id,amount_ngn,type,method,description,reference,created_at').eq('customer_id',user.id).order('created_at',{ascending:false}).limit(6)
 ]);
 return <main className="container" style={{padding:'40px 0 70px'}}>
  <div className="nav"><div><div className="brand">Customer Dashboard</div><div className="muted">{profile.email}</div></div></div>
  {funding==='success'&&<div className="notice">Flutterwave payment verified and your balance has been credited.</div>}
  {funding==='failed'&&<div className="notice">The funding payment could not be verified. Your balance was not changed.</div>}
  {funding==='sent'&&<div className="notice">Your manual funding receipt was submitted for admin review.</div>}
  <section className="section">
   <div className="stat-grid">
    <div className="card"><h3>Balance</h3><div className="price">₦{Number(profile.balance_ngn||0).toLocaleString()}</div><p>Available wallet balance.</p><a className="btn primary" href="/account/add-funds">Add funds</a></div>
    <div className="card"><h3>Total orders</h3><div className="price">{totalOrders??0}</div><p>All orders on your account.</p></div>
    <div className="card"><h3>Pending orders</h3><div className="price">{pendingOrders??0}</div><p>Orders awaiting payment or processing.</p></div>
    <div className="card"><h3>Completed orders</h3><div className="price">{completedOrders??0}</div><p>Orders marked completed.</p></div>
   </div>
   <div className="card" style={{marginTop:24}}><div className="nav"><div><h2 style={{margin:0}}>Recent transactions</h2><p className="muted">Your latest wallet activity.</p></div><a className="btn secondary" href="/account/funding-history">View history</a></div>
    {history?.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Type</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th></tr></thead><tbody>{history.map(t=><tr key={t.id}><td>{t.type==='credit'?'Credit':'Debit'}</td><td>{t.type==='credit'?'+':'-'}₦{Number(t.amount_ngn).toLocaleString()}</td><td>{t.method}</td><td>{t.reference}</td><td>{new Date(t.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>:<p className="muted">No wallet transactions yet.</p>}
   </div>
   <div className="grid" style={{marginTop:24}}>
    <div className="card"><h2>Account</h2><p>Manage your profile and security settings.</p><a className="btn secondary" href="/account/profile">Account settings</a></div>
    <div className="card"><h2>Funding</h2><p>Fund your wallet by Flutterwave or manual transfer.</p><a className="btn secondary" href="/account/add-funds">Add funds</a></div>
    <div className="card"><h2>Orders</h2><p>View your order and payment status.</p><a className="btn secondary" href="/account/orders">Order history</a></div>
   </div>
  </section>
 </main>;
}
