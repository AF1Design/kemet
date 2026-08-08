if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gamcgqbilnbjabxrvgcu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'sb_publishable_MDlAGtJxHXUnJuUVb6NLww_2DBbHV8x';

export const supabase = createClient(supabaseUrl, supabaseKey);

