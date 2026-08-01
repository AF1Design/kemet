import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL || 
                    'https://gamcgqbilnbjabxrvgcu.supabase.co';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Standard Supabase Browser Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
