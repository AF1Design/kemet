'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { useApp } from '../context/AppContext';

export function HorizontalProductRail({
  title,
  subtitle,
  categoryHref = '/category/all',
  products = [],
  limit = 8,
  badge = 'مميز'
}) {
  const { lang, t } = useApp();
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const isDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e) => {
    // Only handle primary left click
    if (e.button !== 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = container.scrollLeft;

    // Temporarily disable smooth scroll and snap for 1:1 real-time drag response
    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDownRef.current) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      const dx = e.pageX - startXRef.current;
      if (Math.abs(dx) > 6) {
        hasDraggedRef.current = true;
      }

      container.scrollLeft = scrollLeftRef.current - dx;
    };

    const handleMouseUp = () => {
      if (!isDownRef.current) return;
      isDownRef.current = false;
      setIsDragging(false);

      const container = scrollContainerRef.current;
      if (container) {
        container.style.scrollBehavior = 'smooth';
        container.style.scrollSnapType = 'x mandatory';
      }

      // Small delay to ensure any subsequent click event from this gesture is suppressed
      if (hasDraggedRef.current) {
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 120);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleClickCapture = (e) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
    <section className="section horizontal-rail-section">
      <div className="container rail-container">
        
        {/* Rail Header with Title & Quick View All Link */}
        <div className="rail-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className="rail-title">
              <span className="brand-glow">{title}</span>
            </h2>
            {badge && (
              <span className="rail-badge">
                {badge}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              href={categoryHref}
              className="btn-rail-view-all"
            >
              <span>{lang === 'ar' ? 'عرض الكل' : 'View All'}</span>
              <span style={{ fontSize: '0.9rem' }}>{lang === 'ar' ? '←' : '→'}</span>
            </Link>

            {/* Desktop Navigation Arrows */}
            <div className="rail-desktop-arrows">
              <button
                type="button"
                onClick={() => handleScroll('prev')}
                className="rail-arrow-btn"
                title={lang === 'ar' ? 'السابق' : 'Previous'}
              >
                {lang === 'ar' ? '→' : '←'}
              </button>

              <button
                type="button"
                onClick={() => handleScroll('next')}
                className="rail-arrow-btn"
                title={lang === 'ar' ? 'التالي' : 'Next'}
              >
                {lang === 'ar' ? '←' : '→'}
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable & Draggable Scroll Container */}
        <div
          ref={scrollContainerRef}
          className={`rail-scroll-container hide-scrollbar ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onDragStart={(e) => e.preventDefault()}
          onClickCapture={handleClickCapture}
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="rail-item-wrapper"
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* Final "View All in Category" Card */}
          <div
            className="rail-view-all-wrapper"
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
                {lang === 'ar' ? 'تصفح القسم بالكامل' : 'Browse Full Category'}
              </span>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
