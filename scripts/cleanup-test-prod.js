process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { getAdminSupabase } from '../src/lib/supabase/admin.js';

async function cleanup() {
  const supabaseAdmin = getAdminSupabase();
  await supabaseAdmin.from('products').delete().like('id', 'test-kit-%');
  console.log('🧹 Test products cleaned up successfully!');
}

cleanup();
