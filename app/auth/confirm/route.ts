import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
    ? nextParam
    : '/login';

  const redirectUrl = new URL(next, request.url);

  if (!token_hash || !type) {
    redirectUrl.pathname = '/login';
    redirectUrl.search = '?verification=error';
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    redirectUrl.pathname = '/login';
    redirectUrl.search = '?verification=error';
    return NextResponse.redirect(redirectUrl);
  }

  // The email is now verified. Sign out this confirmation session so the
  // customer is returned to a clean login screen.
  await supabase.auth.signOut();

  redirectUrl.pathname = '/login';
  redirectUrl.search = '?verification=success';
  return NextResponse.redirect(redirectUrl);
}
