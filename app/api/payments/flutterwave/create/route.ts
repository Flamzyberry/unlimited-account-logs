import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createFlutterwavePayment } from '@/lib/flutterwave';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId) redirect('/account/orders?payment=error');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: order, error } = await supabase
    .from('orders')
    .select('id,product_name,total_ngn,status,payment_reference')
    .eq('id', orderId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error || !order || order.status !== 'pending' || !order.payment_reference) {
    redirect('/account/orders?payment=error');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email,full_name,phone,role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'customer' || !profile.email) {
    redirect('/admin/login');
  }

  try {
    const paymentUrl = await createFlutterwavePayment({
      txRef: order.payment_reference,
      amount: Number(order.total_ngn),
      email: profile.email,
      name: profile.full_name,
      phone: profile.phone,
      redirectUrl: `${url.origin}/api/payments/flutterwave/callback`,
    });

    redirect(paymentUrl);
  } catch {
    redirect(`/account/orders?payment=not-configured&order=${encodeURIComponent(order.id)}`);
  }
}
