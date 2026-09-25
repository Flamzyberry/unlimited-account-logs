import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name, phone, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect('/login?error=profile');
  }
  if (profile.role !== 'customer') redirect('/admin/login');

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <div className="nav">
        <div>
          <div className="brand">Customer Account</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>{profile.email ?? user.email}</div>
        </div>
        <form action="/auth/signout?next=/login" method="post">
          <button className="btn secondary">Sign out</button>
        </form>
      </div>

      <section className="section">
        <div className="card" style={{ maxWidth: 600 }}>
          <h1>Welcome{profile.full_name ? ', ' + profile.full_name : ''}</h1>
          <p style={{ color: '#6b7280' }}>Your customer account is active.</p>
          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
            <div><strong>Email:</strong> {profile.email ?? user.email}</div>
            {profile.phone && <div><strong>Phone:</strong> {profile.phone}</div>}
            <div><strong>Account type:</strong> Customer</div>
          </div>
          <div className="actions">
            <a className="btn primary" href="/account/orders">View order history</a>
            <a className="btn secondary" href="/#products">Browse products</a>
          </div>
        </div>
      </section>
    </main>
  );
}
