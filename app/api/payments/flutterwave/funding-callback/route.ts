import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txRef = url.searchParams.get('tx_ref');
  const transactionId = url.searchParams.get('transaction_id');
  const status = url.searchParams.get('status');

  if (!txRef || !transactionId || status !== 'successful') {
    redirect('/account?funding=failed');
  }

  try {
    const transaction = await verifyFlutterwaveTransaction(transactionId);
    const admin = createAdminClient();

    const { data: funding } = await admin.from('funding_requests')
      .select('id,amount_ngn,status,payment_reference,method')
      .eq('payment_reference', txRef)
      .maybeSingle();

    if (!funding || funding.status !== 'pending' || funding.method !== 'flutterwave' ||
        funding.payment_reference !== transaction.tx_ref ||
        transaction.status !== 'successful' ||
        transaction.currency !== 'NGN' ||
        Number(transaction.amount) < Number(funding.amount_ngn)) {
      throw new Error('Funding payment did not match');
    }

    const { error } = await admin.rpc('credit_flutterwave_funding', {
      p_request_id: funding.id,
    });
    if (error) throw error;
  } catch {
    redirect('/account?funding=failed');
  }

  redirect('/account?funding=success');
}
