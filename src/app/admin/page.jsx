import React from 'react';
import Link from 'next/link';
import { getAdminSupabase } from '../../lib/supabase/admin';
import { PromoEmailControl } from '../../components/admin/PromoEmailControl';
import { CouponsControl } from '../../components/admin/CouponsControl';
import { AnnouncementBarControl } from '../../components/admin/AnnouncementBarControl';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let totalProducts = 0;
  let activeProducts = 0;
  let totalCategories = 0;
  let abandonedCartsCount = 0;

  try {
    const supabaseAdmin = getAdminSupabase();

    const [{ count: prodCount }, { count: activeCount }, { count: catCount }, { count: abCount }] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }).not('name_en', 'eq', 'ABANDONED_CART').not('id', 'like', '_%'),
      supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }).eq('name_en', 'ABANDONED_CART')
    ]);

    totalProducts = prodCount || 0;
    activeProducts = activeCount || 0;
    totalCategories = catCount || 0;
    abandonedCartsCount = abCount || 0;
  } catch (err) {
    console.error('Error fetching admin counts:', err);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Banner Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي المنتجات</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', fontWeight: 800 }}>[كتالوج]</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--gold-primary)' }}>{totalProducts}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>منتجات في الكتالوج</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>المنتجات النشطة</span>
            <span style={{ fontSize: '1.2rem', color: '#10B981', fontWeight: 800 }}>[مفعل]</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10B981' }}>{activeProducts}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تعرض حالياً للزوار</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>الفئات الرئيسية</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>[أقسام]</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>{totalCategories}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>أطقم / جيم / شورتات</span>
        </div>

        <Link href="/admin/abandoned-carts" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', height: '100%', transition: 'border-color 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>السلات المتروكة</span>
              <span style={{ fontSize: '1.2rem', color: '#F59E0B', fontWeight: 800 }}>[متابعة]</span>
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#F59E0B' }}>{abandonedCartsCount}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>سلات نشطة قيد المتابعة</span>
          </div>
        </Link>

      </div>

      {/* Announcement Bar Control */}
      <div id="announcement-bar">
        <AnnouncementBarControl />
      </div>

      {/* Coupons / Promo Codes Management */}
      <div id="coupons">
        <CouponsControl />
      </div>

      {/* Mass Promo Email Control & Stats Section */}
      <PromoEmailControl />

      {/* Quick Action Cards */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--gold-primary)' }}>
          إجراءات سريعة
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
            إدارة وتعديل الكتالوج والمخزون
          </Link>
          <Link href="/admin/abandoned-carts" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)' }}>
            متابعة السلات المتروكة والعملاء
          </Link>
          <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
            معاينة المتجر كـ زائر
          </Link>
        </div>
      </div>
    </div>
  );
}
