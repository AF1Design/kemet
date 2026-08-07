import sharp from 'sharp';
import { getAdminSupabase } from './supabase/admin.js';

/**
 * 1. Helper: Generates clean, SEO-friendly English/Arabic URL slugs
 * Prioritizes English name if available for clean English image URLs (e.g. real-madrid-white-kit-2027)
 */
export function generateSeoSlug(text = '', nameEn = '') {
  const targetText = (nameEn && String(nameEn).trim()) ? nameEn : text;
  if (!targetText) return 'kemet-product';

  let clean = String(targetText).trim().toLowerCase();

  // If text contains English characters, extract and clean English words first
  const englishMatches = clean.match(/[a-z0-9\s-]+/gi);
  if (englishMatches && englishMatches.join('').trim().length >= 3) {
    clean = englishMatches.join(' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return clean.replace(/^-+|-+$/g, '') || 'kemet-product';
  }

  // Transliterate Arabic to ASCII letters
  const arabicMap = {
    'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'e', 'ء': 'a', 'ؤ': 'o',
    'ة': 'h', 'چ': 'g', 'پ': 'p'
  };

  clean = clean.split('').map(char => arabicMap[char] || char).join('');

  clean = clean
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return clean.replace(/^-+|-+$/g, '') || 'kemet-product';
}

/**
 * 2. Main Server Utility: Processes any image (Base64 or Buffer), converts to WebP & uploads to Supabase Storage
 */
export async function processAndUploadProductImage({ imageInput, productName = 'kemet-product', nameEn = '', productId = '', suffix = '' }) {
  try {
    if (!imageInput) return null;

    const inputStr = String(imageInput).trim();

    // Preserve existing clean URLs (Supabase Storage URLs, custom media proxy URLs or static local assets)
    if (inputStr.startsWith('http://') || inputStr.startsWith('https://') || inputStr.startsWith('/assets/') || inputStr.startsWith('/media/')) {
      if (!inputStr.startsWith('data:image')) {
        return inputStr;
      }
    }

    const supabaseAdmin = getAdminSupabase();

    // Ensure 'products' bucket exists and is public
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'products')) {
        await supabaseAdmin.storage.createBucket('products', {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/gif']
        });
      }
    } catch (e) {}

    let inputBuffer = null;

    if (inputStr.startsWith('data:image')) {
      // Extract Base64 buffer
      const base64Data = inputStr.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(imageInput)) {
      inputBuffer = imageInput;
    } else {
      return imageInput;
    }

    // Convert and compress to ultra-light WebP using sharp
    const webpBuffer = await sharp(inputBuffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Create SEO-friendly deterministic per-product filename (Ensures upsert replaces existing file for this specific product only)
    const cleanSlug = generateSeoSlug(productName, nameEn);
    const cleanId = productId ? String(productId).trim().replace(/[^a-z0-9-]/gi, '') : '';
    const fileName = `kemet-${cleanId ? cleanId + '-' : ''}${cleanSlug}${suffix ? '-' + suffix : ''}.webp`;

    // Upload to Supabase Storage 'products' bucket
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('products')
      .upload(fileName, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year CDN cache
        upsert: true
      });

    if (uploadErr) {
      console.error('Supabase Storage upload error:', uploadErr);
      return imageInput; // Fallback to input if upload fails
    }

    // Get public URL from Supabase Storage bucket
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || imageInput;
  } catch (err) {
    console.error('processAndUploadProductImage exception:', err);
    return imageInput;
  }
}
