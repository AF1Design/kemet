import React, { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ProductDetailClient } from '../../../components/ProductDetailClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kemetmisr.com';

// Fast, cached fetch helper to deduplicate requests between generateMetadata & page component
const fetchProduct = cache(async (id) => {
  try {
    const [prodRes, varRes] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_variants').select('size, stock_quantity').eq('product_id', id)
    ]);

    if (prodRes.error || !prodRes.data) return null;

    const prodData = prodRes.data;
    const varData = varRes.data;

    const variants = (varData && varData.length > 0)
      ? varData.map(v => ({ size: v.size, stock: Number(v.stock_quantity ?? 50) }))
      : ['M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));

    return {
      product: {
        id: prodData.id,
        nameAr: prodData.name_ar,
        nameEn: prodData.name_en,
        descriptionAr: prodData.description_ar,
        descriptionEn: prodData.description_en,
        category: prodData.category_id,
        price: Number(prodData.price),
        oldPrice: prodData.old_price ? Number(prodData.old_price) : null,
        image: prodData.main_image,
        images: prodData.gallery_images || [prodData.main_image],
        isBestSeller: prodData.is_best_seller,
        isNew: prodData.is_new,
        keywords: prodData.keywords || [],
        createdAt: prodData.created_at,
        updatedAt: prodData.updated_at
      },
      variants
    };
  } catch (err) {
    console.error('Error fetching product in server component:', err);
    return null;
  }
});

// Helper to extract primary club / team / model identifier for smart cross-selling
function extractClubOrModel(nameAr = '', nameEn = '', keywords = []) {
  const text = `${nameAr} ${nameEn} ${(keywords || []).join(' ')}`.toLowerCase();

  const clubs = [
    { key: 'ahly', ar: 'الأهلي', en: 'Al Ahly', tokens: ['الأهلي', 'الاهلي', 'ahly', 'ahli'] },
    { key: 'zamalek', ar: 'الزمالك', en: 'Zamalek', tokens: ['الزمالك', 'zamalek'] },
    { key: 'real_madrid', ar: 'ريال مدريد', en: 'Real Madrid', tokens: ['ريال مدريد', 'مدريد', 'real madrid', 'madrid'] },
    { key: 'barcelona', ar: 'برشلونة', en: 'Barcelona', tokens: ['برشلونة', 'برشلونه', 'barcelona', 'barca', 'بارسا'] },
    { key: 'man_city', ar: 'مانشستر سيتي', en: 'Manchester City', tokens: ['مانشستر سيتي', 'مان سيتي', 'manchester city', 'man city'] },
    { key: 'man_united', ar: 'مانشستر يونايتد', en: 'Manchester United', tokens: ['مانشستر يونايتد', 'مان يونايتد', 'manchester united', 'man utd'] },
    { key: 'liverpool', ar: 'ليفربول', en: 'Liverpool', tokens: ['ليفربول', 'liverpool'] },
    { key: 'arsenal', ar: 'أرسنال', en: 'Arsenal', tokens: ['ارسنال', 'أرسنال', 'arsenal'] },
    { key: 'chelsea', ar: 'تشيلسي', en: 'Chelsea', tokens: ['تشيلسي', 'تشيلسى', 'chelsea'] },
    { key: 'bayern', ar: 'بايرن ميونخ', en: 'Bayern Munich', tokens: ['بايرن ميونخ', 'بايرن', 'bayern'] },
    { key: 'psg', ar: 'باريس سان جيرمان', en: 'Paris Saint-Germain', tokens: ['باريس', 'psg', 'paris'] },
    { key: 'juventus', ar: 'يوفنتوس', en: 'Juventus', tokens: ['يوفنتوس', 'juventus', 'juve'] },
    { key: 'inter', ar: 'إنتر ميلان', en: 'Inter Milan', tokens: ['إنتر', 'انتر', 'inter'] },
    { key: 'milan', ar: 'ميلان', en: 'AC Milan', tokens: ['ميلان', 'milan'] },
    { key: 'egypt', ar: 'منتخب مصر', en: 'Egypt National Team', tokens: ['منتخب مصر', 'الفراعنة', 'egypt'] },
    { key: 'argentina', ar: 'الأرجنتين', en: 'Argentina', tokens: ['الأرجنتين', 'الارجنتين', 'argentina'] },
    { key: 'spain', ar: 'إسبانيا', en: 'Spain', tokens: ['إسبانيا', 'اسبانيا', 'spain'] },
    { key: 'france', ar: 'فرنسا', en: 'France', tokens: ['فرنسا', 'france'] },
    { key: 'brazil', ar: 'البرازيل', en: 'Brazil', tokens: ['البرازيل', 'brazil'] },
    { key: 'sleeveless', ar: 'سليف كت', en: 'Sleeveless', tokens: ['سليف كت', 'كت', 'sleeveless', 'tank'] },
    { key: 'shorts', ar: 'شورتات رياضية', en: 'Athletic Shorts', tokens: ['شورت', 'شورتات', 'shorts'] },
    { key: 'tracksuit', ar: 'ترينجات رياضية', en: 'Tracksuits', tokens: ['ترينج', 'ترنج', 'tracksuit', 'sweatshirt'] },
  ];

  for (const club of clubs) {
    if (club.tokens.some(t => text.includes(t.toLowerCase()))) {
      return club;
    }
  }

  return null;
}

// Fast server-side recommendation matcher to fetch related club and model items
const fetchRelatedProducts = cache(async (currentProduct) => {
  if (!currentProduct || !currentProduct.id) {
    return { items: [], titleAr: 'منتجات ذات صلة', titleEn: 'Related Products', categoryHref: '/category/all' };
  }

  try {
    const clubInfo = extractClubOrModel(currentProduct.nameAr, currentProduct.nameEn, currentProduct.keywords);

    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .neq('id', currentProduct.id)
      .order('created_at', { ascending: false });

    if (error || !allProducts) {
      return { items: [], titleAr: 'منتجات ذات صلة', titleEn: 'Related Products', categoryHref: '/category/all' };
    }

    const mappedProducts = allProducts.map(p => ({
      id: p.id,
      nameAr: p.name_ar,
      nameEn: p.name_en,
      descriptionAr: p.description_ar,
      descriptionEn: p.description_en,
      category: p.category_id,
      price: Number(p.price),
      oldPrice: p.old_price ? Number(p.old_price) : null,
      image: p.main_image,
      images: p.gallery_images || [p.main_image],
      isBestSeller: p.is_best_seller,
      isNew: p.is_new,
      keywords: p.keywords || [],
      product_variants: p.product_variants || []
    }));

    // Score products based on matching club/model relevance
    const scoredProducts = mappedProducts.map(candidate => {
      let score = 0;
      const candidateText = `${candidate.nameAr} ${candidate.nameEn} ${(candidate.keywords || []).join(' ')}`.toLowerCase();

      // 1. Exact club match (Top Priority)
      if (clubInfo && clubInfo.tokens.some(t => candidateText.includes(t.toLowerCase()))) {
        score += 100;
      }

      // 2. Same category
      if (candidate.category === currentProduct.category) {
        score += 25;
      }

      // 3. Keyword intersection
      const currentKeywords = (currentProduct.keywords || []).map(k => k.toLowerCase().trim()).filter(Boolean);
      currentKeywords.forEach(k => {
        if (k.length > 2 && candidateText.includes(k)) {
          score += 15;
        }
      });

      // 4. Best seller bonus
      if (candidate.isBestSeller) {
        score += 5;
      }

      return { product: candidate, score };
    });

    scoredProducts.sort((a, b) => b.score - a.score);

    const selectedItems = scoredProducts
      .filter(item => item.score > 0)
      .slice(0, 10)
      .map(item => item.product);

    // Fallback to latest catalog items if matching count is below 4
    if (selectedItems.length < 4) {
      const remainingNeeded = 8 - selectedItems.length;
      const existingIds = new Set(selectedItems.map(p => p.id));
      const fallbacks = mappedProducts.filter(p => !existingIds.has(p.id)).slice(0, remainingNeeded);
      selectedItems.push(...fallbacks);
    }

    let titleAr = 'منتجات ذات صلة';
    let titleEn = 'Related Products';
    let categoryHref = `/category/${currentProduct.category || 'all'}`;

    if (clubInfo) {
      titleAr = `منتجات وتشكيلات ${clubInfo.ar}`;
      titleEn = `${clubInfo.en} Collection`;
      categoryHref = `/category/all?search=${encodeURIComponent(clubInfo.ar)}`;
    }

    return {
      items: selectedItems,
      titleAr,
      titleEn,
      categoryHref
    };
  } catch (err) {
    console.error('Error fetching related products in server component:', err);
    return { items: [], titleAr: 'منتجات ذات صلة', titleEn: 'Related Products', categoryHref: '/category/all' };
  }
});

// 1. Dynamic Unique Metadata API per product page for SEO
export async function generateMetadata({ params }) {
  const result = await fetchProduct(params.id);
  if (!result || !result.product) {
    return {
      title: 'المنتج غير موجود | KEMET',
      description: 'عذراً، المنتج المطلوب غير متوفر حالياً في متجر كيميت.',
    };
  }

  const { product } = result;
  const title = `${product.nameAr} | أطقم كيميت KEMET 2027`;
  const description = product.descriptionAr || `${product.nameAr} - اطلب الآن من KEMET بخامات عالية الجودة 2027 وشحن سريع لكافة المحافظات.`;
  const canonicalUrl = `${baseUrl}/product/${product.id}`;
  const imageUrl = product.image ? (product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`) : `${baseUrl}/assets/kemet-og-image.png`;

  return {
    title,
    description,
    keywords: [
      ...product.keywords,
      product.nameAr,
      product.nameEn,
      'KEMET',
      'أطقم كيميت',
      'Player Edition'
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'KEMET',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.nameAr,
        },
      ],
      locale: 'ar_EG',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// 2. Product Server Component with Product JSON-LD Schema
export default async function ProductDetailPage({ params }) {
  const result = await fetchProduct(params.id);
  if (!result || !result.product) {
    notFound();
  }

  const { product, variants } = result;
  const isAnyInStock = variants.some(v => v.stock > 0);

  // Fetch intelligent related products for the current club or category
  const relatedData = await fetchRelatedProducts(product);

  // Schema.org Product Structured Data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameAr,
    alternateName: product.nameEn,
    image: product.images && product.images.length > 0 ? product.images : [product.image],
    description: product.descriptionAr,
    sku: `KM-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'KEMET',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${product.id}`,
      priceCurrency: 'EGP',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAnyInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'KEMET',
      },
    },
  };

  return (
    <>
      {/* Inject Product JSON-LD Schema for Google Search Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient 
        product={product} 
        initialVariants={variants} 
        relatedData={relatedData} 
      />
    </>
  );
}
