import React from 'react';
import { getAdminSupabase } from '../../../lib/supabase/admin';
import { ProductTable } from '../../../components/admin/ProductTable';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products = [];
  let categories = [];

  try {
    const supabaseAdmin = getAdminSupabase();

    const [{ data: prodData }, { data: catData }] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('categories')
        .select('*')
    ]);

    products = prodData || [];
    categories = (catData || []).filter(c => 
      c.id && 
      !c.id.startsWith('_') && 
      !c.id.toLowerCase().includes('config') && 
      !c.id.toLowerCase().includes('settings') &&
      !String(c.name_ar || '').trim().startsWith('[') &&
      !String(c.name_ar || '').trim().startsWith('{')
    );
  } catch (err) {
    console.error('Error fetching admin products page SSR:', err);
  }

  return (
    <div>
      {/* Section Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.4rem' }}>
          <span className="brand-glow">⚽ إدارة الكتالوج والمخزون</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          إضافة وتعديل المنتجات، تحديث الصور الأربعة، وإدارة كميات المقاسات في الكتالوج
        </p>
      </div>

      {/* Render Client ProductTable */}
      <ProductTable initialProducts={products} categories={categories} />
    </div>
  );
}
