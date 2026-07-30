'use client';

import React from 'react';
import Link from 'next/link';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { WhyKemet } from '../components/WhyKemet';
import { Footer } from '../components/Footer';
import { products } from '../data/products';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { t } = useApp();
  
  // Exactly Real Madrid 2nd Kit & Atletico Madrid Kit as requested
  const bestSellerProducts = products.filter(p => p.id === 'kit-real-madrid-navy-2027' || p.id === 'kit-atletico-madrid-2027');

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 420px))', gap: '2rem', justifyContent: 'center' }}>
            {bestSellerProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

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
            
            {/* Category 1: Kits */}
            <Link href="/category/kits" className="category-card">
              <div className="category-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('navKits')}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('catKitsDesc')}</p>
            </Link>

            {/* Category 2: Gym & Training */}
            <Link href="/category/training" className="category-card">
              <div className="category-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 6.5h11"></path>
                  <path d="M6.5 17.5h11"></path>
                  <path d="M6 12h12"></path>
                  <rect x="2" y="5" width="4" height="14" rx="1"></rect>
                  <rect x="18" y="5" width="4" height="14" rx="1"></rect>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('navTraining')}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('catTrainingDesc')}</p>
            </Link>

            {/* Category 3: Accessories & Sports Gear */}
            <Link href="/category/shorts" className="category-card">
              <div className="category-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('navShorts')}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('catShortsDesc')}</p>
            </Link>

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
