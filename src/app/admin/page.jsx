import React from 'react';
import Link from 'next/link';
import { getAdminSupabase } from '../../lib/supabase/admin';
import { PromoEmailControl } from '../../components/admin/PromoEmailControl';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let totalProducts = 0;
  let activeProducts = 0;
  let totalCategories = 0;

  try {
    const supabaseAdmin = getAdminSupabase();

    const [{ count: prodCount }, { count: activeCount }, { count: catCount }] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('categories').select('*', { count: 'exact', head: true })
    ]);

    totalProducts = prodCount || 0;
    activeProducts = activeCount || 0;
    totalCategories = catCount || 0;
  } catch (err) {
    console.error('Error fetching admin overview metrics:', err);
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          <span className="brand-glow">مرحباً بك في لوحة تحكم KEMET 👑</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          نظام الإدارة المركزي لكتالوج المنتجات والمخزون والطلبات
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي المنتجات</span>
            <span style={{ fontSize: '1.8rem' }}>⚽</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--gold-primary)' }}>{totalProducts}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>منتجات في الكتالوج</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>المنتجات النشطة</span>
            <span style={{ fontSize: '1.8rem' }}>🟢</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10B981' }}>{activeProducts}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تعرض حالياً للزوار</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>الفئات الرئيسية</span>
            <span style={{ fontSize: '1.8rem' }}>📦</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>{totalCategories}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>أطقم / جيم / شورتات</span>
        </div>

      </div>

      {/* Mass Promo Email Control & Stats Section */}
      <PromoEmailControl />

      {/* Quick Action Cards */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--gold-primary)' }}>
          ⚡ إجراءات سريعة
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
            إدارة وتعديل الكتالوج والمخزون ⚽
          </Link>
          <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
            معاينة المتجر كـ زائر 👁️
          </Link>
        </div>
      </div>
    </div>
  );
}
