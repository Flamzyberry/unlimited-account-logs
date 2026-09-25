'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      : { data: null };

    await supabase.auth.signOut();
    setMessage('Your password has been changed. Redirecting to login…');
    setTimeout(() => router.replace(profile?.role === 'admin' ? '/admin/login' : '/login'), 1000);
  }

  return <main className="container" style={{ padding: '60px 0' }}>
    <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1>Reset password</h1>
      <p style={{ color: '#6b7280' }}>Choose a new password for your account.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        <input required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
        <input required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" type="password" style={{ padding: 13, border: '1px solid #d1d5db', borderRadius: 10 }} />
        <button className="btn primary" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
      </form>
      {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}
      {message && <p style={{ color: '#166534', marginTop: 16 }}>{message}</p>}
    </div>
  </main>;
}
