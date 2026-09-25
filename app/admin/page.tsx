import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('profiles').select('role,email,full_name').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const [{ count: products }, { count: customers }, { count: orders }, { count: pendingFunding }, { data: recentOrders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('funding_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id,product_name,total_ngn,status,created_at,customer:profiles!orders_customer_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(8),
  ]);

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <div className="nav">
        <div><div className="brand">Unlimited Digital Admin</div><div style={{ color: '#6b7280', fontSize: 14 }}>{profile.email}</div></div>
        <form action="/auth/signout" method="post"><button className="btn secondary">Sign out</button></form>
      </div>

      <section className="section">
        <div className="grid">
          <div className="card"><h3>Products</h3><div className="price">{products ?? 0}</div><p>Marketplace products.</p><a className="btn secondary" href="/admin/products">Manage products</a></div>
          <div className="card"><h3>Customers</h3><div className="price">{customers ?? 0}</div><p>Registered customers.</p><a className="btn secondary" href="/admin/customers">Manage customers</a></div>
          <div className="card"><h3>Orders</h3><div className="price">{orders ?? 0}</div><p>Customer orders.</p><a className="btn secondary" href="/admin/orders">Manage orders</a></div>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Funding & receipts</h2>
          <p>{pendingFunding ?? 0} funding request(s) currently awaiting review.</p>
          <a className="btn primary" href="/admin/funding">Review funding & receipts</a>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Recent orders</h2>
          {recentOrders?.length ? <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {recentOrders.map((order: any) => (
              <div key={order.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                <strong>{order.product_name}</strong> — ₦{Number(order.total_ngn).toLocaleString()} — {order.status}
                <div style={{ color: '#6b7280', fontSize: 13 }}>{order.customer?.full_name || order.customer?.email || 'Customer'} · {new Date(order.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div> : <p style={{ color: '#6b7280' }}>No orders yet.</p>}
        </div>
      </section>
    </main>
  );
}
