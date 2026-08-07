import { createClient } from '@supabase/supabase-js';

// Server-Only Admin Supabase Client supporting standard environment variable aliases
export const getAdminSupabase = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Security Guard: Admin Supabase client cannot be used in browser context.');
  }

  // Bypass Node.js Windows TLS SSL Certificate Verification for Supabase HTTPS Fetch
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.SUPABASE_URL || 
                      'https://gamcgqbilnbjabxrvgcu.supabase.co';

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
