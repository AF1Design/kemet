import { supabase } from '../lib/supabase';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kemetfit.com';

  // Base static routes
  const staticRoutes = [
    '',
    '/category/all',
    '/category/kits',
    '/category/training',
    '/category/shorts',
    '/our-story',
    '/return-policy',
    '/track-order',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch active products dynamically from Supabase
  let productRoutes = [];
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at, created_at')
      .eq('is_active', true);

    if (products) {
      productRoutes = products.map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.updated_at || product.created_at || Date.now()).toISOString(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error('Error generating product sitemap URLs:', error);
  }

  return [...staticRoutes, ...productRoutes];
}
