import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,description,price_ngn,image_url')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return (
    <main>
      <header className="container nav">
        <div className="brand">Unlimited Digital</div>
        <nav className="navlinks">
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#support">Support</a>
        </nav>
        <a className="btn secondary" href="/login">Sign in</a>
      </header>

      <section className="container hero">
        <p style={{ fontWeight: 700, color: '#4f46e5' }}>DIGITAL MARKETPLACE</p>
        <h1>Buy useful digital products in one place.</h1>
        <p>
          Browse the latest products published by our administrators and place
          legitimate digital-product orders from your customer account.
        </p>
        <div className="actions">
          <a className="btn primary" href="#products">Browse products</a>
          <a className="btn secondary" href="/register">Create account</a>
        </div>
        <div className="notice">
          This marketplace is intended for lawful digital goods and services.
          It must not be used to sell stolen credentials, compromised accounts,
          payment data, or other unauthorized access.
        </div>
      </section>

      <section id="products" className="container section">
        <h2>Available products</h2>
        {error ? (
          <div className="card">
            <h3>Products are temporarily unavailable</h3>
            <p>Please try again shortly.</p>
          </div>
        ) : products?.length ? (
          <div className="grid">
            {products.map((product) => (
              <article className="card" key={product.id}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }}
                  />
                ) : (
                  <div className="icon">✦</div>
                )}
                <h3>{product.name}</h3>
                <p>{product.description || 'Digital product available from Unlimited Digital.'}</p>
                <div className="price">₦{Number(product.price_ngn).toLocaleString()}</div>
                <div style={{ marginTop: 16 }}>
                  <a className="btn primary" href={`/checkout/${product.id}`}>Order now</a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card">
            <h3>No products are available yet.</h3>
            <p>Products published from the admin panel will appear here automatically.</p>
          </div>
        )}
      </section>

      <section id="about" className="container section">
        <div className="card">
          <h2>Built for real customers</h2>
          <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
            Customers can register, sign in, browse active products, place orders,
            and review their order history. Administrators manage the catalog and orders
            from the protected admin dashboard.
          </p>
        </div>
      </section>

      <footer id="support" className="footer">
        <div className="container">© 2026 Unlimited Digital Marketplace · Support available through the site.</div>
      </footer>
    </main>
  );
}
