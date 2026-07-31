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

async function verifyProfile() {
  const adminId = '68e925c7-6211-416b-a217-fa2fb35d4dd1';
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', adminId);

  console.log('Admin Profile Query Result:', data, error);
}

verifyProfile();
