if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server Component Supabase Client using Session Cookies (Publishable Key)
 * Evaluates current user's session context and respects RLS policies!
 */
export async function createClient() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('supabase-auth-token')?.value;

  const options = {
    auth: {
      persistSession: false
    }
  };

  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options
  );
}
