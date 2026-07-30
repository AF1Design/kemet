'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { products } from '../../../data/products';
import { useApp } from '../../../context/AppContext';
import { ImageZoom } from '../../../components/ImageZoom';
import { Footer } from '../../../components/Footer';

export default function ProductDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { lang, addToCart, t } = useApp();

  const product = products.find(p => p.id === id) || products[0];
  const [selectedSize, setSelectedSize] = useState('L');

  // Product 4-Images Gallery State (Ready for Supabase)
  const productGallery = product.images || [
    product.image,
    product.image,
    product.image,
    product.image
  ];
  const [activeImage, setActiveImage] = useState(productGallery[0]);

  if (!product) return null;

  const title = lang === 'ar' ? product.nameAr : product.nameEn;
  const description = lang === 'ar' ? product.descriptionAr : product.descriptionEn;
  const currency = t('currency');
  const priceNote = t('priceNote');
  const availableSizes = product.sizes || ['M', 'L', 'XL', 'XXL'];

  let badgeText = '';
  if (product.isBestSeller) {
    badgeText = t('bestSellerBadge');
  } else if (product.isNew) {
    badgeText = t('newBadge');
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container">
          
          {/* Back Navigation Button */}
          <button 
            type="button"
            onClick={() => router.back()} 
            style={{ marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-primary)', cursor: 'pointer' }}
          >
            {t('productBackBtn')}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Interactive 4-Image Gallery Viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Main Image View */}
              <div style={{ position: 'relative' }}>
                <ImageZoom src={activeImage} alt={title} />
                {badgeText && (
                  <div className="product-badge" style={{ top: '15px', right: '15px', fontSize: '0.8rem' }}>
                    {badgeText}
                  </div>
                )}
              </div>

              {/* 4 Thumbnails Gallery Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {productGallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    style={{
                      border: activeImage === imgUrl ? '2px solid var(--border-gold-bright)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      height: '75px',
                      background: '#000',
                      cursor: 'pointer',
                      opacity: activeImage === imgUrl ? 1 : 0.65,
                      transition: 'all 0.25s ease',
                      boxShadow: activeImage === imgUrl ? 'var(--shadow-glow)' : 'none',
                      padding: 0
                    }}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`${title} detail ${idx + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </button>
                ))}
              </div>

            </div>

            {/* Product Details & Purchase Form */}
            <div>
              <div style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {t('productInStock')}
              </div>

              <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.25 }}>
                <span className="brand-glow">{title}</span>
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                  {product.price} {currency}
                </span>
                {product.oldPrice && (
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {product.oldPrice} {currency}
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{priceNote}</span>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {description}
              </p>

              {/* Size Selector */}
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  {t('selectSizeLabel')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`size-pill ${size === selectedSize ? 'active' : ''}`}
                      style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button 
                type="button"
                className="btn-primary" 
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', marginBottom: '1.75rem' }}
                onClick={() => addToCart(product, selectedSize)}
              >
                {t('addToCart')} ({selectedSize})
              </button>

              {/* Fabric Specs & Guarantees */}
              <div style={{ background: 'rgba(212, 175, 55, 0.06)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--gold-primary)' }}>
                  {t('productSpecsTitle')}
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <li>{t('spec1')}</li>
                  <li>{t('spec2')}</li>
                  <li>{t('spec3')}</li>
                </ul>
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  {t('deliveryGuarantee')}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
