'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ImageZoom } from './ImageZoom';
import { HorizontalProductRail } from './HorizontalProductRail';
import { Footer } from './Footer';
import { trackViewItem, trackAddToCart } from '../lib/analytics';

export const ProductDetailClient = ({ product, initialVariants, relatedData }) => {
  const router = useRouter();
  const { lang, addToCart, showToast, t } = useApp();

  const [selectedSizeObj, setSelectedSizeObj] = useState(() => {
    const firstInStock = initialVariants.find(v => v.stock > 0);
    return firstInStock || initialVariants[0] || { size: 'M', stock: 50 };
  });

  const [activeImage, setActiveImage] = useState(product.image);

  const title = lang === 'ar' ? product.nameAr : product.nameEn;
  const description = lang === 'ar' ? product.descriptionAr : product.descriptionEn;

  const isSelectedOutOfStock = selectedSizeObj ? selectedSizeObj.stock <= 0 : false;
  const isAllOutOfStock = initialVariants.every(v => v.stock <= 0);

  // Marketing Analytics: View Item
  useEffect(() => {
    if (product) {
      trackViewItem(product);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (isAllOutOfStock || isSelectedOutOfStock) {
      showToast(lang === 'ar' ? '⚠️ هذا المقاس غير متوفر حالياً (منتهي الكمية)' : '⚠️ Selected size is out of stock!');
      return;
    }
    addToCart(product, selectedSizeObj.size);
    trackAddToCart(product, selectedSizeObj.size, 1);
  };

  const handleBuyNow = () => {
    if (isAllOutOfStock || isSelectedOutOfStock) {
      showToast(lang === 'ar' ? '⚠️ هذا المقاس غير متوفر حالياً (منتهي الكمية)' : '⚠️ Selected size is out of stock!');
      return;
    }
    addToCart(product, selectedSizeObj.size);
    trackAddToCart(product, selectedSizeObj.size, 1);
    router.push('/checkout');
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container">
          
          <div style={{ marginBottom: '1.5rem' }}>
            <Link href="/category/all" className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              {t('productBackBtn')}
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3.5rem', alignItems: 'start' }}>
            
            {/* Gallery Column */}
            <div>
              <div style={{ background: 'transparent', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-glow)', marginBottom: '1rem' }}>
                <ImageZoom src={activeImage || product.image} alt={title} />
              </div>

              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: 'var(--radius-md)',
                        border: activeImage === imgUrl ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'transparent',
                        padding: '0',
                        flexShrink: 0
                      }}
                    >
                      <img src={imgUrl} alt={`${title} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div>
              {product.isBestSeller && (
                <span className="product-badge" style={{ position: 'static', display: 'inline-block', marginBottom: '1rem' }}>
                  {t('bestSellerBadge')}
                </span>
              )}

              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                  {product.price} {t('currency')}
                </span>
                {product.oldPrice && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                    {product.oldPrice} {t('currency')}
                  </span>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('priceNote')}</span>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                {description}
              </p>

              {/* Sizes Selection with Out-of-Stock Handling */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {t('selectSizeLabel')}
                </div>
                
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {initialVariants.map((item) => {
                    const isOut = item.stock <= 0;
                    const isSelected = selectedSizeObj?.size === item.size;

                    return (
                      <button
                        key={item.size}
                        type="button"
                        onClick={() => {
                          if (isOut) {
                            showToast(lang === 'ar' ? `⚠️ مقاس (${item.size}) نفد من المخزن وغير متاح للطلب` : `⚠️ Size (${item.size}) is out of stock!`);
                            return;
                          }
                          setSelectedSizeObj(item);
                        }}
                        style={{
                          padding: '0.55rem 1.1rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(212, 175, 55, 0.15)' : (isOut ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-card)'),
                          color: isOut ? '#F43F5E' : (isSelected ? 'var(--gold-primary)' : 'var(--text-primary)'),
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          opacity: isOut ? 0.45 : 1,
                          textDecoration: isOut ? 'line-through' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {item.size} {isOut ? (lang === 'ar' ? '(منتهي ❌)' : '(Out ❌)') : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddToCart}
                  disabled={isAllOutOfStock || isSelectedOutOfStock}
                  style={{
                    flex: '1 1 200px',
                    padding: '0.95rem 1.5rem',
                    opacity: (isAllOutOfStock || isSelectedOutOfStock) ? 0.5 : 1,
                    cursor: (isAllOutOfStock || isSelectedOutOfStock) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🛒 {isSelectedOutOfStock ? (lang === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock') : t('addToCart')}
                </button>
                
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBuyNow}
                  disabled={isAllOutOfStock || isSelectedOutOfStock}
                  style={{
                    flex: '1 1 200px',
                    padding: '0.95rem 1.5rem',
                    opacity: (isAllOutOfStock || isSelectedOutOfStock) ? 0.5 : 1,
                    cursor: (isAllOutOfStock || isSelectedOutOfStock) ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⚡ {lang === 'ar' ? 'شراء فوري' : 'Buy Now'}
                </button>
              </div>

              {/* Product Specifications & Guarantee */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold-primary)' }}>
                  {t('productSpecsTitle')}
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <li>{t('spec1')}</li>
                  <li>{t('spec2')}</li>
                  <li>{t('spec3')}</li>
                  <li style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{t('deliveryGuarantee')}</li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Smart Club & Model Related Products Rail */}
      {relatedData && relatedData.items && relatedData.items.length > 0 && (
        <HorizontalProductRail
          title={lang === 'ar' ? (relatedData.titleAr || 'منتجات ذات صلة') : (relatedData.titleEn || 'Related Products')}
          badge={lang === 'ar' ? 'تشكيلة مختارة' : 'Featured Collection'}
          categoryHref={relatedData.categoryHref || '/category/all'}
          products={relatedData.items}
          limit={10}
        />
      )}

      <Footer />
    </div>
  );
};
