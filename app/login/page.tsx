'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <main className="container" style={{ padding: '60px 0' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Sign in</h1>
        {searchParams.get('registered') === '1' && (
          <p style={{ color: '#166534' }}>Your account is ready. Sign in to continue.</p>
        )}
        <p style={{ color: '#6b7280' }}>Sign in to your customer account.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <input aria-label="Email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" type="email" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input aria-label="Password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" type="password" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
        <p style={{ marginTop: 18, fontSize: 14 }}>
          New customer? <a href="/register" style={{ color: '#4f46e5' }}>Create an account</a>
        </p>
        <p style={{ marginTop: 10, fontSize: 14 }}>
          Administrator? <a href="/admin/login" style={{ color: '#4f46e5' }}>Admin login</a>
        </p>
      </div>
    </main>
  );
}
