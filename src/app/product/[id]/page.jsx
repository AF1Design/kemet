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
      : ['S', 'M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));

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
      <ProductDetailClient product={product} initialVariants={variants} />
    </>
  );
}
