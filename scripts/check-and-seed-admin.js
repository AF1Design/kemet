process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Read env variables securely from .env.local without hardcoding secrets
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = value;
    }
  });
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkAndCreateAdmin() {
  console.log('🔍 Checking Supabase Auth for Admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kemet.eg';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.log('⚠️ Admin password not set in environment.');
    return;
  }

  // 1. Check if admin user exists in auth.users
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listErr) {
    console.error('Error listing users:', listErr.message);
    return;
  }

  let adminUser = users.find(u => u.email === adminEmail);

  if (!adminUser) {
    console.log('🚀 Creating Admin user in Supabase Auth...');
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'أدمن كيما المباشر',
        role: 'admin'
      }
    });

    if (createErr) {
      console.error('Error creating admin user:', createErr.message);
      return;
    }
    adminUser = createData.user;
    console.log('✅ Admin user created with ID:', adminUser.id);
  } else {
    console.log('✅ Admin user already exists in Auth:', adminUser.id);
  }

  // 2. Ensure profile exists in profiles table and role is 'admin'
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', adminUser.id)
    .single();

  if (!profile) {
    console.log('📝 Creating Admin profile in profiles table...');
    await supabaseAdmin.from('profiles').insert({
      id: adminUser.id,
      full_name: 'أدمن كيما المباشر',
      phone: '01000000000',
      governorate: 'القاهرة',
      role: 'admin'
    });
  } else if (profile.role !== 'admin') {
    console.log('⚙️ Updating profile role to admin...');
    await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', adminUser.id);
  }

  console.log('✅ Admin profile is active and role = admin!');
}

checkAndCreateAdmin();
