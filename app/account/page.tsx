import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ funding?: string }>;
}) {
  const { funding } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name, phone, role, balance_ngn, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect('/login?error=profile');
  }
  if (profile.role !== 'customer') redirect('/admin/login');

  const { data: history } = await supabase
    .from('wallet_transactions')
    .select('id,amount_ngn,method,description,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <div className="nav">
        <div>
          <div className="brand">Customer Dashboard</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>{profile.email ?? user.email}</div>
        </div>
        <form action="/auth/signout?next=/login" method="post">
          <button className="btn secondary">Sign out</button>
        </form>
      </div>

      {funding === 'success' && <div className="notice">Your Flutterwave payment was verified and your balance has been credited.</div>}
      {funding === 'failed' && <div className="notice">We could not verify that funding payment. Your balance was not changed.</div>}
      {funding === 'sent' && <div className="notice">Your manual funding receipt was submitted. Your balance will be updated after admin confirmation.</div>}

      <section className="section">
        <div className="grid">
          <div className="card">
            <h3>Customer balance</h3>
            <div className="price">₦{Number(profile.balance_ngn || 0).toLocaleString()}</div>
            <p>Available balance for your account.</p>
            <a className="btn primary" href="/account/add-funds">Add funds</a>
          </div>
          <div className="card">
            <h3>Add funds</h3>
            <p>Choose Flutterwave or manual funding with receipt confirmation.</p>
            <a className="btn secondary" href="/account/add-funds">Choose payment method</a>
          </div>
          <div className="card">
            <h3>Payment history</h3>
            <p>View completed credits and funding requests.</p>
            <a className="btn secondary" href="/account/funding-history">View payment history</a>
          </div>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Recent payments</h2>
          {history?.length ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {history.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                  <strong>+₦{Number(item.amount_ngn).toLocaleString()}</strong> · {item.method}
                  <div style={{ color: '#6b7280', fontSize: 13 }}>
                    {item.description || 'Wallet funding'} · {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#6b7280' }}>No completed wallet payments yet.</p>}
        </div>

        <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
          <h2>Account details</h2>
          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
            <div><strong>Email:</strong> {profile.email ?? user.email}</div>
            {profile.phone && <div><strong>Phone:</strong> {profile.phone}</div>}
            <div><strong>Account type:</strong> Customer</div>
          </div>
          <div className="actions">
            <a className="btn secondary" href="/account/orders">View order history</a>
            <a className="btn secondary" href="/#products">Browse products</a>
          </div>
        </div>
      </section>
    </main>
  );
}
