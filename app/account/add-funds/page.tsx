import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function submitManualFunding(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const amount = Number(formData.get('amount'));
  const note = String(formData.get('note') || '').trim().slice(0, 500);
  const file = formData.get('receipt');

  if (!Number.isInteger(amount) || amount < 100) {
    redirect('/account/add-funds?error=amount');
  }
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    redirect('/account/add-funds?error=receipt');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) redirect('/account/add-funds?error=type');

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = user.id + '/' + crypto.randomUUID() + '.' + extension;

  const { error: uploadError } = await supabase.storage
    .from('payment-receipts')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) redirect('/account/add-funds?error=upload');

  const { error } = await supabase.from('funding_requests').insert({
    customer_id: user.id,
    amount_ngn: amount,
    method: 'manual',
    status: 'pending',
    receipt_path: path,
    customer_note: note || null,
  });

  if (error) {
    await supabase.storage.from('payment-receipts').remove([path]);
    redirect('/account/add-funds?error=request');
  }

  redirect('/account?funding=sent');
}

export default async function AddFundsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles')
    .select('role,balance_ngn')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'customer') redirect('/admin/login');

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/account">← Account dashboard</a></p>
      <h1>Add funds</h1>
      <p style={{ color: '#6b7280' }}>Choose a payment method to add money to your customer balance.</p>

      {error && <div className="notice">
        {error === 'amount' ? 'Enter a valid amount of at least ₦100.' :
         error === 'receipt' ? 'Upload a payment receipt up to 5 MB.' :
         error === 'type' ? 'Receipt must be JPG, PNG, WEBP, or PDF.' :
         'We could not submit the funding request. Please try again.'}
      </div>}

      <div className="grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h2>Flutterwave</h2>
          <p>Pay securely through Flutterwave. Successful payments are verified on the server before your balance is credited.</p>
          <form action="/api/payments/flutterwave/fund" method="get" style={{ display: 'grid', gap: 12 }}>
            <input name="amount" type="number" min="100" step="1" placeholder="Amount in NGN" required />
            <button className="btn primary">Continue with Flutterwave</button>
          </form>
        </div>

        <div className="card">
          <h2>Manual funding</h2>
          <p>Make your transfer using the payment details provided by the administrator, then upload your receipt below. Your balance is credited only after admin confirmation.</p>
          <form action={submitManualFunding} encType="multipart/form-data" style={{ display: 'grid', gap: 12 }}>
            <input name="amount" type="number" min="100" step="1" placeholder="Amount in NGN" required />
            <input name="receipt" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" required />
            <textarea name="note" maxLength={500} rows={3} placeholder="Optional payment note" />
            <button className="btn primary">Send receipt for review</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Current balance</h3>
        <div className="price">₦{Number(profile.balance_ngn || 0).toLocaleString()}</div>
      </div>
    </main>
  );
}
