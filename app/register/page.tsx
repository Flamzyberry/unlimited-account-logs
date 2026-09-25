'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace('/login?registered=1');
      router.refresh();
      return;
    }

    setMessage('Account created. Check your email to confirm your account, then sign in.');
    setLoading(false);
  }

  return (
    <main className="container" style={{ padding: '60px 0' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Create account</h1>
        <p style={{ color: '#6b7280' }}>
          Create your customer account with secure Supabase authentication.
        </p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <input aria-label="Name" required value={name} onChange={e => setName(e.target.value)}
            placeholder="Full name" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input aria-label="Email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" type="email" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input aria-label="Phone" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Phone number" type="tel" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input aria-label="Password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password (minimum 6 characters)" type="password"
            style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
        {message && <p style={{ color: '#166534', marginTop: 16 }}>{message}</p>}
        <p style={{ marginTop: 18, fontSize: 14 }}>
          Already registered? <a href="/login" style={{ color: '#4f46e5' }}>Sign in</a>
        </p>
      </div>
    </main>
  );
}
