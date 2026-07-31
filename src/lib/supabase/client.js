import { createClient } from '@supabase/supabase-js';

// Browser Client for Public / User operations using Publishable Key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
