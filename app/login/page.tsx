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
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  async function forgotPassword(e: FormEvent) {
    e.preventDefault();
    setResetLoading(true); setResetMessage(''); setError('');
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
    setLoading(true); setError('');
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });

    if (signInError || !signInData.user) {
      setError(signInError?.message || 'Unable to sign in.');
      setLoading(false); return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role,account_status').eq('id', signInData.user.id).maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      setError('Unable to verify your account role. Please try again.');
      setLoading(false); return;
    }

    if (profile?.account_status === 'suspended') { await supabase.auth.signOut(); setError('This customer account is suspended. Please contact support.'); setLoading(false); return; }\n\n    if (profile?.role === 'admin') {
      await supabase.auth.signOut();
      setError('Administrator accounts must use the admin login.');
      setLoading(false); return;
    }

    if (profile?.role !== 'customer') {
      await supabase.auth.signOut();
      setError('Your account is not configured for customer access.');
      setLoading(false); return;
    }

    const next = searchParams.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
    router.replace(safeNext);
    router.refresh();
  }

  return (
    <main className="container" style={{ padding: '60px 0' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Sign in</h1>
        {searchParams.get('registered') === '1' && <p style={{ color: '#166534' }}>Your account is ready. Sign in to continue.</p>}
        {searchParams.get('verification') === 'success' && <p style={{ color: '#166534' }}>Email verified successfully. You can now sign in.</p>}
        {searchParams.get('verification') === 'error' && <p style={{ color: '#b91c1c' }}>We could not complete email verification. Please request a new confirmation email.</p>}
        <p style={{ color: '#6b7280' }}>Sign in to your customer account.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <input aria-label="Email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <input aria-label="Password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
        <form onSubmit={forgotPassword} style={{ marginTop: 14 }}>
          <input aria-label="Reset email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Email for password reset" type="email" style={{ width: '100%', padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
          <button className="btn secondary" type="submit" disabled={resetLoading} style={{ marginTop: 8 }}>{resetLoading ? 'Sending…' : 'Forgot password?'}</button>
        </form>
        {resetMessage && <p style={{ color: '#166534', marginTop: 12 }}>{resetMessage}</p>}
        <p style={{ marginTop: 18, fontSize: 14 }}>New customer? <a href="/register" style={{ color: '#4f46e5' }}>Create an account</a></p>
        <p style={{ marginTop: 10, fontSize: 14 }}>Administrator? <a href="/admin/login" style={{ color: '#4f46e5' }}>Admin login</a></p>
      </div>
    </main>
  );
}
