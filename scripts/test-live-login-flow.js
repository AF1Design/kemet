process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Read env variables securely from .env.local without hardcoding secrets
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminPassword = process.env.ADMIN_PASSWORD;

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') publishableKey = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = value;
      if (key === 'ADMIN_PASSWORD') adminPassword = value;
    }
  });
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testLoginFlow() {
  if (!adminPassword) {
    console.log('⚠️ ADMIN_PASSWORD not configured.');
    return;
  }

  console.log('🔑 Testing Supabase Auth Login with admin@kemet.eg...');
  const supabase = createClient(supabaseUrl, publishableKey);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@kemet.eg',
    password: adminPassword
  });

  if (error) {
    console.error('❌ Supabase Auth Login Failed:', error.message);
    return;
  }

  console.log('✅ Supabase Auth Login Successful!');
  console.log('User ID:', data.user.id);
  console.log('Access Token acquired (first 30 chars):', data.session.access_token.substring(0, 30) + '...');

  // Test user verification with token using supabaseAdmin.auth.getUser(token)
  const { data: { user: verifiedUser }, error: verifyErr } = await supabaseAdmin.auth.getUser(data.session.access_token);
  console.log('Verified User from JWT token:', verifiedUser?.id, verifyErr?.message || 'OK');

  // Test HTTP GET request to http://localhost:3000/admin with session cookie
  console.log('\n🌐 Testing HTTP Request to http://localhost:3000/admin WITH session cookie & Auth Header...');
  try {
    const response = await fetch('http://localhost:3000/admin', {
      headers: {
        'Cookie': `sb-access-token=${data.session.access_token}; supabase-auth-token=${data.session.access_token}`,
        'Authorization': `Bearer ${data.session.access_token}`
      }
    });

    console.log('Server Response Status Code:', response.status);
    const htmlText = await response.text();

    if (response.status === 200) {
      console.log('🎉 🎉 🎉 LIVE ADMIN DASHBOARD RENDERED SUCCESSFULLY STATUS 200 OK!');
      console.log('Dashboard Title Found in HTML:', htmlText.includes('لوحة التحكم الإدارية') || htmlText.includes('Dashboard'));
      console.log('Metrics Title Found in HTML:', htmlText.includes('إجمالي المنتجات') || htmlText.includes('إحصائيات'));
    } else {
      console.error('⚠️ Response failed with status:', response.status);
    }
  } catch (httpErr) {
    console.error('HTTP Request error:', httpErr.message);
  }
}

testLoginFlow();
