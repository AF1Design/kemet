import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { products } from '../src/data/products.js';

// Bypass local SSL certificate verification for Node CLI on Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Parse .env.local manually to ensure smooth standalone execution
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  let foundServiceKey = null;
  let foundUrl = null;
  let foundPublishableKey = null;

  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') foundUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') foundServiceKey = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') foundPublishableKey = value;
    }
  });

  if (foundUrl) supabaseUrl = foundUrl;
  supabaseKey = foundServiceKey || foundPublishableKey;
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Key Prefix (first 10 chars):', supabaseKey ? supabaseKey.slice(0, 10) : 'none');
  console.log('🔒 Secret key starts with sb_secret_?:', supabaseKey?.startsWith("sb_secret_"));
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categoriesToSeed = [
  {
    id: 'kits',
    name_ar: 'أطقم الأندية والمنتخبات 2027',
    name_en: '2027 Club Kits',
    description_ar: 'أطقم 2027 الرسمية (Player Edition) بسعر 280 ج.م',
    description_en: 'Official 2027 Kits (Player Edition) at 280 EGP'
  },
  {
    id: 'training',
    name_ar: 'ملابس التدريب والجيم 2027',
    name_en: '2027 Gym Wear',
    description_ar: 'تيشيرتات وخامات ضاغطة للتمرين وشورتات',
    description_en: 'Gym compression wear, cut tees & shorts'
  },
  {
    id: 'shorts',
    name_ar: 'إكسسوارات ومستلزمات رياضية',
    name_en: 'Sports Accessories & Gear',
    description_ar: 'حقائب رياضية، حظاظات، شنكار ومستلزمات',
    description_en: 'Sports bags, wristbands, shin guards & gear'
  }
];

const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

async function seedDatabase() {
  console.log('🚀 Starting KEMET Supabase Seeding Process...');

  // 1. Seed Categories (Upsert)
  console.log('📦 Seeding Categories...');
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .upsert(categoriesToSeed, { onConflict: 'id' })
    .select();

  if (catError) {
    console.error('❌ Error seeding categories FULL DETAILS:');
    console.error('Code:', catError.code);
    console.error('Message:', catError.message);
    console.error('Details:', catError.details);
    console.error('Hint:', catError.hint);
    console.error('Full Error Object:', JSON.stringify(catError, null, 2));
    return;
  }
  console.log(`✅ Categories seeded successfully (${catData.length} categories).`);

  // 2. Seed Products (Upsert)
  console.log('⚽ Seeding Products...');
  const productsToSeed = products.map(p => ({
    id: p.id,
    category_id: p.category,
    name_ar: p.nameAr,
    name_en: p.nameEn,
    description_ar: p.descriptionAr || '',
    description_en: p.descriptionEn || '',
    price: p.price,
    old_price: p.oldPrice || null,
    main_image: p.image,
    gallery_images: p.images || [p.image],
    is_best_seller: p.isBestSeller ?? false,
    is_new: p.isNew ?? true,
    is_active: true,
    keywords: p.keywords || []
  }));

  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .upsert(productsToSeed, { onConflict: 'id' })
    .select();

  if (prodError) {
    console.error('❌ Error seeding products:', prodError.message || prodError);
    return;
  }
  console.log(`✅ Products seeded successfully (${prodData.length} products).`);

  // 3. Seed Product Variants / Sizes (Upsert)
  console.log('📏 Seeding Product Variants (Sizes & Stock)...');
  const variantsToSeed = [];
  products.forEach(p => {
    defaultSizes.forEach(size => {
      variantsToSeed.push({
        product_id: p.id,
        size: size,
        stock_quantity: 50
      });
    });
  });

  const { data: varData, error: varError } = await supabase
    .from('product_variants')
    .upsert(variantsToSeed, { onConflict: 'product_id,size' })
    .select();

  if (varError) {
    console.error('❌ Error seeding product variants:', varError.message || varError);
    return;
  }
  console.log(`✅ Product Variants seeded successfully (${varData.length} variants).`);

  console.log('🎉 All KEMET Data Seeded Successfully to Supabase with ZERO Errors!');
  console.log('==================================================');
  console.log(`SUMMARY: ${catData.length} Categories, ${prodData.length} Products, ${varData.length} Product Variants.`);
  console.log('==================================================');
}

seedDatabase().catch(err => console.error('Unhandled seed error:', err));
