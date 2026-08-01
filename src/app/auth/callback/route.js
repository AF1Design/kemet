import { NextResponse } from 'next/server';
import { getAdminSupabase } from '../../../lib/supabase/admin.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') || 'signup';
  const next = requestUrl.searchParams.get('next') || '/my-orders';

  try {
    const supabaseAdmin = getAdminSupabase();

    if (token_hash && type) {
      const { error } = await supabaseAdmin.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}/login?confirmed=true`);
      }
    }

    if (code) {
      const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}/login?confirmed=true`);
      }
    }
  } catch (err) {
    console.error('Error in auth callback route:', err);
  }

  // Redirect to login page with confirmed=true banner flag
  return NextResponse.redirect(`${requestUrl.origin}/login?confirmed=true`);
}
