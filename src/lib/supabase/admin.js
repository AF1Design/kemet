import { createClient } from '@supabase/supabase-js';

// Server-Only Admin Supabase Client supporting standard environment variable aliases
export const getAdminSupabase = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Security Guard: Admin Supabase client cannot be used in browser context.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.SUPABASE_URL || 
                      'https://gamcgqbilnbjabxrvgcu.supabase.co';

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('لم يتم العثور على مفتاح Supabase في متغيرات البيئة (SUPABASE_SERVICE_ROLE_KEY أو NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
