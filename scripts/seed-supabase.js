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
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🚀 Starting Supabase Database Seeding...');

  // 1. Seed Categories
  const categoriesList = [
    { id: 'kits', name_ar: 'أطقم الأندية والمنتخبات', name_en: 'Official Kits', description_ar: 'أطقم كرة القدم الرسمية لعام 2027 بأعلى جودة خامات' },
    { id: 'training', name_ar: 'ملابس التدريب والجيم', name_en: 'Training & Gym', description_ar: 'ترنجات وتيشيرتات تمارين رياضية مريحة وعملية' },
    { id: 'shorts', name_ar: 'الشورتات والبنطال', name_en: 'Shorts & Pants', description_ar: 'شورتات وبناطيل رياضية عالية القدرة على التهوية' }
  ];

  console.log('📦 Seeding Categories...');
  for (const cat of categoriesList) {
    const { error } = await supabase.from('categories').upsert(cat);
    if (error) console.error(`Error seeding category ${cat.id}:`, error.message);
  }

  // 2. Seed Products
  console.log('👕 Seeding Products...');
  for (const p of products) {
    const productRecord = {
      id: p.id,
      category_id: p.category,
      name_ar: p.nameAr,
      name_en: p.nameEn,
      description_ar: p.descriptionAr || 'خامات رياضية متطورة بتقنية الـ Dri-FIT للتهوية السريعة ومقاومة التعرق.',
      description_en: p.descriptionEn || 'Advanced athletic fabric with Dri-FIT technology.',
      price: p.price,
      old_price: p.oldPrice || null,
      main_image: p.image,
      gallery_images: [p.image, p.image, p.image, p.image],
      is_best_seller: p.isBestSeller || false,
      is_new: p.isNew || false,
      keywords: p.keywords || [p.nameAr, p.nameEn]
    };

    const { error: prodErr } = await supabase.from('products').upsert(productRecord);
    if (prodErr) {
      console.error(`Error seeding product ${p.id}:`, prodErr.message);
      continue;
    }

    // Seed product variants (sizes)
    const sizes = p.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
    for (const sz of sizes) {
      const variantRecord = {
        product_id: p.id,
        size: sz,
        stock_quantity: 50
      };
      await supabase.from('product_variants').upsert(variantRecord, { onConflict: 'product_id, size' });
    }
  }

  console.log('✅ Supabase Seeding Completed Successfully!');
}

seedDatabase();
