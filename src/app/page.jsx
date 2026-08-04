'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { WhyKemet } from '../components/WhyKemet';
import { Footer } from '../components/Footer';
import { KemetLoader } from '../components/KemetLoader';
import { supabase } from '../lib/supabase';

export default function Home() {
  const { lang, t } = useApp();

  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function loadHomePageData() {
      setIsLoading(true);
      setFetchError(null);

      try {
        const [{ data: productsData, error: prodErr }, { data: categoriesData, error: catErr }] = await Promise.all([
          supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('is_active', true)
            .eq('is_best_seller', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
        ]);

        if (prodErr) {
          console.error('Error fetching products:', prodErr);
          setFetchError(prodErr.message || 'فشل في جلب المنتجات');
        } else if (productsData) {
          const mapped = productsData.map(p => ({
            id: p.id,
            nameAr: p.name_ar,
            nameEn: p.name_en,
            descriptionAr: p.description_ar,
            descriptionEn: p.description_en,
            category: p.category_id,
            price: Number(p.price),
            oldPrice: p.old_price ? Number(p.old_price) : null,
            image: p.main_image,
            images: p.gallery_images,
            isBestSeller: p.is_best_seller,
            isNew: p.is_new,
            keywords: p.keywords,
            product_variants: p.product_variants || []
          }));
          setBestSellerProducts(mapped);
        }

        if (catErr) {
          console.error('Error fetching categories:', catErr);
        } else if (categoriesData) {
          const map = {};
          categoriesData.forEach(c => {
            map[c.id] = c;
          });
          setCategoriesMap(map);
        }
      } catch (err) {
        console.error('Unhandled Home fetch error:', err);
        setFetchError('حدث خطأ أثناء الاتصال بقاعدة البيانات');
      } finally {
        setIsLoading(false);
      }
    }

    loadHomePageData();
  }, []);

  // Dynamic Categories List localized based on current lang state
  const categoriesList = [
    {
      id: 'kits',
      title: lang === 'ar' ? (categoriesMap['kits']?.name_ar || t('navKits')) : (categoriesMap['kits']?.name_en || t('navKits')),
      desc: lang === 'ar' ? (categoriesMap['kits']?.description_ar || t('catKitsDesc')) : (categoriesMap['kits']?.description_en || t('catKitsDesc')),
      href: '/category/kits',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          <path d="M2 12h20"></path>
        </svg>
      )
    },
    {
      id: 'training',
      title: lang === 'ar' ? (categoriesMap['training']?.name_ar || t('navTraining')) : (categoriesMap['training']?.name_en || t('navTraining')),
      desc: lang === 'ar' ? (categoriesMap['training']?.description_ar || t('catTrainingDesc')) : (categoriesMap['training']?.description_en || t('catTrainingDesc')),
      href: '/category/training',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5h11"></path>
          <path d="M6.5 17.5h11"></path>
          <path d="M6 12h12"></path>
          <rect x="2" y="5" width="4" height="14" rx="1"></rect>
          <rect x="18" y="5" width="4" height="14" rx="1"></rect>
        </svg>
      )
    },
    {
      id: 'shorts',
      title: lang === 'ar' ? (categoriesMap['shorts']?.name_ar || t('navShorts')) : (categoriesMap['shorts']?.name_en || t('navShorts')),
      desc: lang === 'ar' ? (categoriesMap['shorts']?.description_ar || t('catShortsDesc')) : (categoriesMap['shorts']?.description_en || t('catShortsDesc')),
      href: '/category/shorts',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      )
    }
  ];

  return (
    <div>
      {/* 1. Hero Banner */}
      <Hero />

      {/* 2. الأكثر مبيعاً 🔥 (Best Sellers Section) */}
      <section className="section" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">{t('featuredProductsTitle')}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700, maxWidth: '600px', margin: '0 auto' }}>
              {t('featuredProductsSubtitle')}
            </p>
          </div>

          {isLoading ? (
            <KemetLoader message={lang === 'ar' ? 'جاري تحميل منتجات KEMET...' : 'Loading KEMET products...'} />
          ) : fetchError ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', maxWidth: '500px', margin: '0 auto' }}>
              <p style={{ color: '#F43F5E', fontWeight: 700, marginBottom: '0.5rem' }}>
                {lang === 'ar' ? 'مؤقتاً غير قادرين على جلب المنتجات' : 'Unable to load products temporarily'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {lang === 'ar' ? 'يرجى تحديث الصفحة أو المحاولة لاحقاً' : 'Please refresh the page or try again later'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 420px))', gap: '2rem', justifyContent: 'center' }}>
              {bestSellerProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Main Category Cards */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>{t('categoriesTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>{t('categoriesSubtitle')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.75rem' }}>
            {categoriesList.map(cat => (
              <Link key={cat.id} href={cat.href} className="category-card">
                <div className="category-icon-wrapper">
                  {cat.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{cat.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Brand Story Featured Section Banner */}
      <section className="section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '48px', margin: '0 auto 1.25rem' }} />
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem' }}>
              <span className="brand-glow">{t('storyPreviewTitle')}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '720px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
              "{t('storyPreviewText')}"
            </p>
            <Link href="/our-story" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
              {t('readStoryBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Why KEMET Features */}
      <WhyKemet />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
