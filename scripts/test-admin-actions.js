process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { 
  createProductAction, 
  updateProductAction, 
  toggleProductActiveAction, 
  updateProductInventoryAction 
} from '../src/app/admin/actions.js';

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

async function runTests() {
  console.log('🧪 Starting Practical Live Tests for Admin Actions...\n');

  const testProdId = `test-kit-${Date.now()}`;

  // TEST 1: Create Product Action
  console.log('1️⃣ Testing createProductAction...');
  const createRes = await createProductAction(
    {
      id: testProdId,
      categoryId: 'kits',
      nameAr: 'طقم تجريبي أمان 2027',
      nameEn: 'Security Test Kit 2027',
      descriptionAr: 'وصف تجريبي لاختبار العمليات الإدارية',
      descriptionEn: 'Test description for admin operations',
      price: 350,
      oldPrice: 420,
      mainImage: '/assets/kemet-hero-banner.jpg',
      isBestSeller: true,
      isNew: true,
      isActive: true
    },
    [
      { size: 'S', stockQuantity: 25 },
      { size: 'M', stockQuantity: 40 },
      { size: 'L', stockQuantity: 15 }
    ]
  );
  console.log('Create Product Result:', createRes);

  // TEST 2: Update Product Inventory Action
  console.log('\n2️⃣ Testing updateProductInventoryAction...');
  const invRes = await updateProductInventoryAction(testProdId, [
    { size: 'S', stockQuantity: 0 },
    { size: 'M', stockQuantity: 100 },
    { size: 'L', stockQuantity: 50 }
  ]);
  console.log('Update Inventory Result:', invRes);

  // TEST 3: Toggle Active Action
  console.log('\n3️⃣ Testing toggleProductActiveAction...');
  const toggleRes = await toggleProductActiveAction(testProdId, true);
  console.log('Toggle Active Result:', toggleRes);

  // Cleanup Test Product
  console.log('\n🧹 Cleaning up test product...');
  await supabaseAdmin.from('product_variants').delete().eq('product_id', testProdId);
  await supabaseAdmin.from('products').delete().eq('id', testProdId);
  console.log('✅ Cleanup finished cleanly!');
}

runTests();
