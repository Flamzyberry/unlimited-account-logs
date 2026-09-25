import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function saveManualPaymentSettings(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const accountNumber = String(formData.get('account_number') || '').trim().slice(0, 100);
  const bankName = String(formData.get('bank_name') || '').trim().slice(0, 120);
  const accountName = String(formData.get('account_name') || '').trim().slice(0, 120);
  const note = String(formData.get('note') || '').trim().slice(0, 1000);

  if (!accountNumber || !bankName || !accountName) redirect('/admin/manual-payment?error=required');

  const { error } = await supabase.from('manual_payment_settings').update({
    account_number: accountNumber,
    bank_name: bankName,
    account_name: accountName,
    note,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);

  if (error) redirect('/admin/manual-payment?error=save');
  redirect('/admin/manual-payment?saved=1');
}

export default async function ManualPaymentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('profiles').select('role,email').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const { data: settings } = await supabase.from('manual_payment_settings').select('account_number,bank_name,account_name,note').eq('id', 1).maybeSingle();

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/admin">← Admin dashboard</a></p>
      <div className="nav">
        <div><div className="brand">Manual payment account</div><div style={{ color: '#6b7280', fontSize: 14 }}>{profile.email}</div></div>
        <a className="btn secondary" href="/admin/funding">Funding & receipts</a>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h1>Manual payment details</h1>
        <p style={{ color: '#6b7280' }}>These details are shown to customers on the Manual funding page. Only administrators can change them.</p>
        {saved && <div className="notice">Manual payment details saved successfully.</div>}
        {error && <div className="notice">{error === 'required' ? 'Account number, bank name and account name are required.' : 'Could not save the payment details. Please try again.'}</div>}

        <form action={saveManualPaymentSettings} style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <label>Account number<input name="account_number" defaultValue={settings?.account_number || ''} inputMode="numeric" maxLength={100} required /></label>
          <label>Bank name<input name="bank_name" defaultValue={settings?.bank_name || ''} maxLength={120} required /></label>
          <label>Account name<input name="account_name" defaultValue={settings?.account_name || ''} maxLength={120} required /></label>
          <label>Note<textarea name="note" defaultValue={settings?.note || ''} maxLength={1000} rows={5} placeholder="Optional instructions for customers" /></label>
          <button className="btn primary">Save manual payment details</button>
        </form>
      </div>
    </main>
  );
}
