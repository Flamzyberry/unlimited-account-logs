'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  async function forgotPassword(e: FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    setError('');
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (resetError) setError(resetError.message);
    else setResetMessage('If that email is registered, a password reset link has been sent.');
    setResetLoading(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message || 'Unable to sign in.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account is not an administrator.');
      setLoading(false);
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className="container" style={{ padding: '60px 0' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Admin Login</h1>
        <p style={{ color: '#6b7280' }}>Sign in with your authorized administrator account.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <input required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Admin email" type="email" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" type="password" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in as admin'}
          </button>
        </form>
        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
        <form onSubmit={forgotPassword} style={{ marginTop: 14 }}>
          <input aria-label="Reset email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
            placeholder="Admin email for password reset" type="email" style={{ width: '100%', padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn secondary" type="submit" disabled={resetLoading} style={{ marginTop: 8 }}>
            {resetLoading ? 'Sending…' : 'Forgot password?'}
          </button>
        </form>
        {resetMessage && <p style={{ color: '#166534', marginTop: 12 }}>{resetMessage}</p>}
        <p style={{ marginTop: 18, fontSize: 14 }}>
          Customer? <a href="/login" style={{ color: '#4f46e5' }}>Customer login</a>
        </p>
      </div>
    </main>
  );
}
