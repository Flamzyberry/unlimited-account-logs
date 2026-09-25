import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const txRef = url.searchParams.get('tx_ref');
  const transactionId = url.searchParams.get('transaction_id');

  if (!txRef) redirect('/account/orders?payment=failed');

  if (status !== 'successful' || !transactionId) {
    redirect('/account/orders?payment=failed');
  }

  try {
    const transaction = await verifyFlutterwaveTransaction(transactionId);
    const admin = createAdminClient();

    const { data: order } = await admin
      .from('orders')
      .select('id,total_ngn,status,payment_reference')
      .eq('payment_reference', txRef)
      .maybeSingle();

    if (
      !order ||
      order.status !== 'pending' ||
      order.payment_reference !== transaction.tx_ref ||
      transaction.status !== 'successful' ||
      transaction.currency !== 'NGN' ||
      Number(transaction.amount) < Number(order.total_ngn)
    ) {
      redirect('/account/orders?payment=failed');
    }

    const { error } = await admin
      .from('orders')
      .update({
        status: 'paid',
        payment_reference: transaction.tx_ref,
      })
      .eq('id', order.id)
      .eq('status', 'pending');

    if (error) redirect('/account/orders?payment=failed');

    redirect('/account/orders?payment=success');
  } catch {
    redirect('/account/orders?payment=failed');
  }
}
