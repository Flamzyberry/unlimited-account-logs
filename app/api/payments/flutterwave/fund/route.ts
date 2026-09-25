import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createFlutterwavePayment } from '@/lib/flutterwave';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amount = Number(url.searchParams.get('amount'));
  if (!Number.isInteger(amount) || amount < 100) redirect('/account/add-funds?error=amount');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles')
    .select('email,full_name,phone,role')
    .eq('id', user.id).maybeSingle();
  if (profile?.role !== 'customer' || !profile.email) redirect('/admin/login');

  const txRef = 'UAL-WALLET-' + crypto.randomUUID();
  const { data: requestRow, error } = await supabase.from('funding_requests').insert({
    customer_id: user.id,
    amount_ngn: amount,
    method: 'flutterwave',
    status: 'pending',
    payment_reference: txRef,
  }).select('id').single();

  if (error || !requestRow) redirect('/account/add-funds?error=request');

  try {
    const paymentUrl = await createFlutterwavePayment({
      txRef,
      amount,
      email: profile.email,
      name: profile.full_name,
      phone: profile.phone,
      redirectUrl: `${url.origin}/api/payments/flutterwave/funding-callback`,
    });
    redirect(paymentUrl);
  } catch {
    redirect('/account/add-funds?error=payment');
  }
}
