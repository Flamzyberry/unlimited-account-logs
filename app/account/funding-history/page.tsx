import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function FundingHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'customer') redirect('/admin/login');

  const { data: transactions } = await supabase.from('wallet_transactions')
    .select('id,amount_ngn,type,method,reference,description,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const { data: requests } = await supabase.from('funding_requests')
    .select('id,amount_ngn,method,status,customer_note,admin_note,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/account">← Account dashboard</a></p>
      <h1>Payment history</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {transactions?.map((t) => (
          <div className="card" key={t.id}>
            <strong>{t.description || 'Wallet transaction'}</strong>
            <p>+₦{Number(t.amount_ngn).toLocaleString()} · {t.method}</p>
            <small>{new Date(t.created_at).toLocaleString()} · {t.reference || 'No reference'}</small>
          </div>
        ))}
        {requests?.filter(r => r.status === 'pending').map((r) => (
          <div className="card" key={r.id}>
            <strong>Funding review pending</strong>
            <p>₦{Number(r.amount_ngn).toLocaleString()} · {r.method}</p>
            <small>{new Date(r.created_at).toLocaleString()}</small>
          </div>
        ))}
        {!transactions?.length && !requests?.length && <p>No funding history yet.</p>}
      </div>
    </main>
  );
}
