import { NextResponse } from 'next/server';
import { getAdminSupabase } from '../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') || 'signup';
  const next = requestUrl.searchParams.get('next') || '/my-orders';

  const supabaseAdmin = getAdminSupabase();

  try {
    if (token_hash && type) {
      const { error } = await supabaseAdmin.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}?confirmed=true`);
      }
    }

    if (code) {
      const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}?confirmed=true`);
      }
    }
  } catch (err) {
    console.error('Error in auth callback:', err);
  }

  // Redirect user to login page with confirmed=true flag
  return NextResponse.redirect(`${requestUrl.origin}/login?confirmed=true`);
}
