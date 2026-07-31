'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useApp } from '../../../context/AppContext';
import { ImageZoom } from '../../../components/ImageZoom';
import { Footer } from '../../../components/Footer';
import { KemetLoader } from '../../../components/KemetLoader';

export default function ProductDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { lang, addToCart, showToast, t } = useApp();

  const [product, setProduct] = useState(null);
  const [variantsList, setVariantsList] = useState([]);
  const [selectedSizeObj, setSelectedSizeObj] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function loadProductDetail() {
      if (!id) return;
      setIsLoading(true);
      setFetchError(null);

      try {
        // 1. Fetch Product details from Supabase products table
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prodErr || !prodData) {
          console.error('Error or product not found:', prodErr);
          setFetchError(prodErr?.message || 'المنتج غير موجود');
          setProduct(null);
          setIsLoading(false);
          return;
        }

        // 2. Fetch Product Variants (sizes & stock) from product_variants table
        const { data: varData } = await supabase
          .from('product_variants')
          .select('size, stock_quantity')
          .eq('product_id', id);

        const mappedProduct = {
          id: prodData.id,
          nameAr: prodData.name_ar,
          nameEn: prodData.name_en,
          descriptionAr: prodData.description_ar,
          descriptionEn: prodData.description_en,
          category: prodData.category_id,
          price: Number(prodData.price),
          oldPrice: prodData.old_price ? Number(prodData.old_price) : null,
          image: prodData.main_image,
          images: prodData.gallery_images || [prodData.main_image],
          isBestSeller: prodData.is_best_seller,
          isNew: prodData.is_new,
          keywords: prodData.keywords || []
        };

        setProduct(mappedProduct);
        setActiveImage(mappedProduct.image);

        let formattedVariants = [];
        if (varData && varData.length > 0) {
          formattedVariants = varData.map(v => ({
            size: v.size,
            stock: Number(v.stock_quantity ?? 50)
          }));
        } else {
          formattedVariants = ['S', 'M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));
        }

        setVariantsList(formattedVariants);

        const firstInStock = formattedVariants.find(v => v.stock > 0);
        setSelectedSizeObj(firstInStock || formattedVariants[0]);

      } catch (err) {
        console.error('Unhandled error loading product:', err);
        setFetchError('حدث خطأ غير متوقع في تحميل المنتج');
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadProductDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KemetLoader message={lang === 'ar' ? 'جاري تحميل تفاصيل المنتج والمقاسات...' : 'Loading product details and sizes...'} />
        </section>
        <Footer />
      </div>
    );
  }

  // STRICT 404 STATE - Absolute zero fallback to another product!
  if (fetchError || !product) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(16px)', 
            border: '1px solid var(--border-gold)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '4rem 2rem',
            textAlign: 'center',
            maxWidth: '550px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛍️</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              {lang === 'ar' ? 'المنتج غير موجود (404)' : 'Product Not Found (404)'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              {lang === 'ar' ? 'عذراً، المنتج الذي تحاول الوصول إليه غير متوفر في الكتالوج الحالي.' : 'Sorry, the product you are trying to view is not available.'}
            </p>
            <Link href="/" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
              {t('backHomeBtn')}
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const title = lang === 'ar' ? product.nameAr : product.nameEn;
  const description = lang === 'ar' ? product.descriptionAr : product.descriptionEn;
  const currency = t('currency');
  const priceNote = t('priceNote');

  // Product 4-Images Gallery State
  const productGallery = product.images && product.images.length > 0 ? product.images : [
    product.image,
    product.image,
    product.image,
    product.image
  ];

  let badgeText = '';
  if (product.isBestSeller) {
    badgeText = t('bestSellerBadge');
  } else if (product.isNew) {
    badgeText = t('newBadge');
  }

  const isSelectedOutOfStock = selectedSizeObj ? selectedSizeObj.stock <= 0 : false;
  const isAllOutOfStock = variantsList.every(v => v.stock <= 0);

  const handleAddToCart = () => {
    if (isAllOutOfStock || isSelectedOutOfStock) {
      showToast(lang === 'ar' ? '⚠️ هذا المقاس غير متوفر حالياً (منتهي الكمية)' : '⚠️ Selected size is out of stock!');
      return;
    }
    addToCart(product, selectedSizeObj.size);
  };

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
                      alt={`${title} view ${idx + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </button>
                ))}
              </div>

            </div>

            {/* Product Details & Purchase Form */}
            <div>
              <div style={{ 
                color: isAllOutOfStock ? '#F43F5E' : '#10B981', 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                marginBottom: '0.5rem' 
              }}>
                {isAllOutOfStock ? '⚠️ منتهي الكمية بالكامل (Out of Stock)' : t('productInStock')}
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

              {/* Size Selector with Out-of-Stock Status */}
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  {t('selectSizeLabel')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {variantsList.map(v => {
                    const isOut = v.stock <= 0;
                    const isSelected = selectedSizeObj?.size === v.size;

                    return (
                      <button
                        key={v.size}
                        type="button"
                        className={`size-pill ${isSelected ? 'active' : ''}`}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.9rem',
                          opacity: isOut ? 0.45 : 1,
                          textDecoration: isOut ? 'line-through' : 'none',
                          borderColor: isOut ? 'rgba(244,63,94,0.4)' : undefined,
                          color: isOut ? '#F43F5E' : undefined
                        }}
                        onClick={() => setSelectedSizeObj(v)}
                        title={isOut ? 'منتهي الكمية' : `متوفر: ${v.stock}`}
                      >
                        {v.size} {isOut ? '(منتهي ❌)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart CTA Button */}
              <button 
                type="button"
                className="btn-primary" 
                disabled={isAllOutOfStock || isSelectedOutOfStock}
                style={{ 
                  width: '100%', 
                  padding: '0.9rem', 
                  fontSize: '1.05rem', 
                  marginBottom: '1.75rem',
                  opacity: (isAllOutOfStock || isSelectedOutOfStock) ? 0.6 : 1,
                  cursor: (isAllOutOfStock || isSelectedOutOfStock) ? 'not-allowed' : 'pointer',
                  background: (isAllOutOfStock || isSelectedOutOfStock) ? 'rgba(244,63,94,0.2)' : undefined,
                  color: (isAllOutOfStock || isSelectedOutOfStock) ? '#F43F5E' : undefined,
                  borderColor: (isAllOutOfStock || isSelectedOutOfStock) ? 'rgba(244,63,94,0.4)' : undefined
                }}
                onClick={handleAddToCart}
              >
                {isAllOutOfStock 
                  ? '⚠️ نَفَدَت الكَمّية بالكامل' 
                  : (isSelectedOutOfStock 
                      ? `⚠️ المقاس (${selectedSizeObj?.size}) غير متوفر` 
                      : `${t('addToCart')} (${selectedSizeObj?.size})`
                    )
                }
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
