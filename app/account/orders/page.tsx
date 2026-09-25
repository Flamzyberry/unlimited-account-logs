import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CustomerOrders({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string; payment?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'customer') redirect('/admin/login');

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id,product_name,quantity,total_ngn,status,notes,payment_reference,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const { placed, payment } = await searchParams;

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/account">← Account</a></p>
      <h1>Order history</h1>

      {payment === 'success' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Payment was verified successfully. Your order is now marked as paid.
        </div>
      )}

      {payment === 'failed' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Payment was not completed or could not be verified. Your order remains pending.
        </div>
      )}

      {payment === 'not-configured' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Flutterwave Test Mode is not configured on the server yet. Add the test secret key in Vercel, then try the order again.
        </div>
      )}

      {placed === '1' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Your order was created successfully and is currently pending payment/processing.
        </div>
      )}

      {error && (
        <div className="notice" style={{ marginBottom: 18 }}>
          We could not load your orders. Please try again.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {orders?.map((order) => (
          <div className="card" key={order.id}>
            <h3>{order.product_name}</h3>
            <p>
              Quantity: {order.quantity} · Total: ₦{Number(order.total_ngn).toLocaleString()}
            </p>
            <p>Status: <strong>{order.status}</strong></p>
            {order.status === 'pending' && (
              <a className="btn primary" href={`/api/payments/flutterwave/create?orderId=${encodeURIComponent(order.id)}`}>
                Pay with Flutterwave
              </a>
            )}
            {order.payment_reference && <p>Payment reference: {order.payment_reference}</p>}
            {order.notes && <p>Note: {order.notes}</p>}
            <small>{new Date(order.created_at).toLocaleString()}</small>
          </div>
        ))}

        {!orders?.length && <p>No orders yet. <a href="/#products">Browse products</a>.</p>}
      </div>
    </main>
  );
}
