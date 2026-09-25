import { createAdminClient } from '@/lib/supabase/admin';
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expectedHash = process.env.FLW_WEBHOOK_SECRET;
  const receivedHash = request.headers.get('verif-hash');

  if (!expectedHash || !receivedHash || receivedHash !== expectedHash) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const transactionId = payload?.data?.id;
  const txRef = payload?.data?.tx_ref;

  if (!transactionId || !txRef) {
    return new Response('Bad request', { status: 400 });
  }

  try {
    const transaction = await verifyFlutterwaveTransaction(String(transactionId));
    const admin = createAdminClient();

    if (String(transaction.tx_ref).startsWith('UAL-WALLET-')) {
      const { data: funding } = await admin.from('funding_requests')
        .select('id,amount_ngn,status,payment_reference,method')
        .eq('payment_reference', txRef)
        .maybeSingle();

      if (!funding || funding.method !== 'flutterwave' ||
          funding.payment_reference !== transaction.tx_ref ||
          transaction.status !== 'successful' ||
          transaction.currency !== 'NGN' ||
          Number(transaction.amount) < Number(funding.amount_ngn)) {
        return new Response('Ignored', { status: 200 });
      }

      const { error } = await admin.rpc('credit_flutterwave_funding', {
        p_request_id: funding.id,
      });
      if (error) throw error;

      return new Response('OK', { status: 200 });
    }

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
      return new Response('Ignored', { status: 200 });
    }

    const { error } = await admin
      .from('orders')
      .update({ status: 'paid', payment_reference: transaction.tx_ref })
      .eq('id', order.id)
      .eq('status', 'pending');

    if (error) throw error;
    return new Response('OK', { status: 200 });
  } catch {
    return new Response('Verification failed', { status: 500 });
  }
}
