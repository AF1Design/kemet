if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@supabase/supabase-js';

// Server-Only Admin Client using Secret Service Role Key
// WARNING: NEVER import this file in Client Components or ship to the browser!
export const getAdminSupabase = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Security Error: Admin Supabase client cannot be instantiated on the browser.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gamcgqbilnbjabxrvgcu.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey) {
    console.error('CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables!');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
