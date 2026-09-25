import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function placeOrder(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const productId = String(formData.get('product_id') || '');
  const rawQuantity = Number(formData.get('quantity') || 1);
  const quantity = Number.isInteger(rawQuantity) ? Math.max(1, Math.min(99, rawQuantity)) : 1;
  const notes = String(formData.get('notes') || '').trim().slice(0, 500);

  if (!productId) redirect('/?error=product');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'customer') redirect('/admin/login');

  const { data: product } = await supabase
    .from('products')
    .select('id,name,description,price_ngn')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle();

  if (!product) redirect('/?error=unavailable');

  const txRef = `UAL-${crypto.randomUUID()}`;

  const { data: order, error } = await supabase.from('orders').insert({
    customer_id: user.id,
    product_id: product.id,
    product_name: product.name,
    quantity,
    unit_price_ngn: product.price_ngn,
    status: 'pending',
    payment_reference: txRef,
    notes: notes || null,
  }).select('id').single();

  if (error || !order) {
    redirect(`/checkout/${product.id}?error=order`);
  }

  redirect(`/api/payments/flutterwave/create?orderId=${encodeURIComponent(order.id)}`);
}

export default async function CheckoutPage({ params, searchParams }: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { productId } = await params;
  const { error: checkoutError } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout/${productId}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'customer') redirect('/admin/login');

  const { data: product } = await supabase
    .from('products')
    .select('id,name,description,price_ngn')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle();

  if (!product) notFound();

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/#products">← Back to products</a></p>
      <div className="card" style={{ maxWidth: 680, margin: '30px auto' }}>
        <p style={{ fontWeight: 700, color: '#4f46e5' }}>CHECKOUT</p>
        <h1>{product.name}</h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          {product.description || 'Digital product'}
        </p>
        <div className="price" style={{ margin: '20px 0' }}>
          ₦{Number(product.price_ngn).toLocaleString()} per item
        </div>

        {checkoutError && (
          <div className="notice" style={{ marginBottom: 18 }}>
            We could not create the order. Please try again.
          </div>
        )}

        <form action={placeOrder} style={{ display: 'grid', gap: 16 }}>
          <input type="hidden" name="product_id" value={product.id} />
          <label>
            <strong>Quantity</strong>
            <input
              name="quantity"
              type="number"
              min="1"
              max="99"
              defaultValue="1"
              style={{ width: '100%', marginTop: 8, padding: 12, border: '1px solid #d1d5db', borderRadius: 10 }}
              required
            />
          </label>
          <label>
            <strong>Order note (optional)</strong>
            <textarea
              name="notes"
              maxLength={500}
              rows={4}
              placeholder="Add any lawful delivery or product instructions."
              style={{ width: '100%', marginTop: 8, padding: 12, border: '1px solid #d1d5db', borderRadius: 10 }}
            />
          </label>
          <button className="btn primary" type="submit">Place order &amp; continue to payment</button>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Your order is created first. Payment is handled separately through Flutterwave secure checkout; you will be redirected there after you submit this form.
          </p>
        </form>
      </div>
    </main>
  );
}
