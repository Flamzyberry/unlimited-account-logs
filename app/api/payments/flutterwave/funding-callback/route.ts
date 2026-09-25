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
      .select('id,customer_id,amount_ngn,status,payment_reference,method')
      .eq('payment_reference', txRef)
      .maybeSingle();

    if (!funding || funding.status !== 'pending' || funding.method !== 'flutterwave' ||
        funding.payment_reference !== transaction.tx_ref ||
        transaction.status !== 'successful' ||
        transaction.currency !== 'NGN' ||
        Number(transaction.amount) < Number(funding.amount_ngn)) {
      throw new Error('Funding payment did not match');
    }

    const { error } = await admin.from('profiles')
      .update({ balance_ngn: Number(funding.amount_ngn) + Number(
        (await admin.from('profiles').select('balance_ngn').eq('id', funding.customer_id).single()).data?.balance_ngn || 0
      ) })
      .eq('id', funding.customer_id);
    if (error) throw error;

    const { error: txError } = await admin.from('wallet_transactions').insert({
      customer_id: funding.customer_id,
      amount_ngn: funding.amount_ngn,
      type: 'credit',
      method: 'flutterwave',
      reference: transaction.tx_ref,
      description: 'Flutterwave wallet funding',
      funding_request_id: funding.id,
    });
    if (txError) throw txError;

    await admin.from('funding_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', funding.id).eq('status', 'pending');

    redirect('/account?funding=success');
  } catch {
    redirect('/account?funding=failed');
  }
}
