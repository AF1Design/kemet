'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { useApp } from '../context/AppContext';

export function HorizontalProductRail({
  title,
  subtitle,
  categoryHref = '/category/all',
  products = [],
  limit = 8,
  badge = '🔥 مميز'
}) {
  const { lang, t } = useApp();
  const scrollContainerRef = useRef(null);

  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, limit);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340; // width of card + gap
    const isRtl = lang === 'ar';
    const multiplier = direction === 'next' ? (isRtl ? -1 : 1) : (isRtl ? 1 : -1);
    
    scrollContainerRef.current.scrollBy({
      left: scrollAmount * multiplier,
      behavior: 'smooth'
    });
  };

  return (
    <section className="section horizontal-rail-section" style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Rail Header with Title, Subtitle, and Quick Links / Scroll Arrows */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              {badge && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--gold-primary)'
                }}>
                  {badge}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, margin: 0 }}>
              <span className="brand-glow">{title}</span>
            </h2>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem', margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href={categoryHref}
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: 'var(--gold-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.25)',
                transition: 'all 0.3s ease'
              }}
            >
              <span>{lang === 'ar' ? 'عرض الكل' : 'View All'}</span>
              <span style={{ fontSize: '1.1rem' }}>{lang === 'ar' ? '←' : '→'}</span>
            </Link>

            {/* Desktop Navigation Arrows */}
            <div className="rail-desktop-arrows" style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => handleScroll('prev')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--gold-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 800,
                  transition: 'all 0.2s ease'
                }}
                title={lang === 'ar' ? 'السابق' : 'Previous'}
              >
                {lang === 'ar' ? '→' : '←'}
              </button>

              <button
                type="button"
                onClick={() => handleScroll('next')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--gold-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 800,
                  transition: 'all 0.2s ease'
                }}
                title={lang === 'ar' ? 'التالي' : 'Next'}
              >
                {lang === 'ar' ? '←' : '→'}
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable Scroll Container */}
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: '1.5rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            paddingBottom: '1.5rem',
            paddingTop: '0.5rem',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          className="hide-scrollbar"
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              style={{
                flex: '0 0 auto',
                width: 'min(300px, 82vw)',
                scrollSnapAlign: 'start'
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* Final "View All in Category" Card */}
          <div
            style={{
              flex: '0 0 auto',
              width: 'min(240px, 70vw)',
              scrollSnapAlign: 'start',
              display: 'flex'
            }}
          >
            <Link
              href={categoryHref}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(11,15,25,0.9) 100%)',
                border: '2px dashed var(--border-gold-bright)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#FFF',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.2)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                color: 'var(--gold-primary)',
                marginBottom: '1.25rem'
              }}>
                {lang === 'ar' ? '←' : '→'}
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                {lang === 'ar' ? 'عرض كافة المنتجات' : 'View All Products'}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {lang === 'ar' ? `استكشف باقي تشكيلة ${title}` : `Explore all products in ${title}`}
              </p>

              <span className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                {lang === 'ar' ? 'تصفح القسم بالكامل 🛍️' : 'Browse Category 🛍️'}
              </span>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
