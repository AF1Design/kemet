'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';

export const ProductCard = ({ product }) => {
  const { lang, addToCart, showToast, t } = useApp();

  if (!product) return null;

  const title = lang === 'ar' ? (product.nameAr || product.name_ar) : (product.nameEn || product.name_en);
  const currency = t('currency');
  const priceNote = t('priceNote');

  // Extract variants or fallback sizes
  const variants = product.product_variants || product.variants || [];
  
  // Format sizes list with stock check
  let sizesList = [];
  if (variants.length > 0) {
    sizesList = variants.map(v => ({
      size: v.size,
      stock: Number(v.stock_quantity ?? 50)
    }));
  } else {
    // Fallback standard sizes
    sizesList = ['S', 'M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));
  }

  // Initial selected size: Pick first available in-stock size or first size
  const firstInStock = sizesList.find(s => s.stock > 0);
  const [selectedSizeObj, setSelectedSizeObj] = useState(firstInStock || sizesList[0]);

  const isSelectedOutOfStock = selectedSizeObj ? selectedSizeObj.stock <= 0 : false;
  const isAllOutOfStock = sizesList.every(s => s.stock <= 0);

  const isFeaturedProduct = Boolean(
    product.isFeatured || 
    product.is_featured || 
    (Array.isArray(product.keywords) && product.keywords.includes('IS_FEATURED_GOLD'))
  );

  let badgeText = '';
  if (isFeaturedProduct) {
    badgeText = '👑 Premium';
  } else if (product.isBestSeller || product.is_best_seller) {
    badgeText = t('bestSellerBadge');
  } else if (product.isNew || product.is_new) {
    badgeText = t('newBadge');
  }

  const handleAddToCartClick = () => {
    if (isAllOutOfStock || isSelectedOutOfStock) {
      showToast(lang === 'ar' ? '⚠️ هذا المقاس غير متوفر حالياً (منتهي الكمية)' : '⚠️ Selected size is out of stock!');
      return;
    }
    addToCart(product, selectedSizeObj.size);
  };

  return (
    <div className={`product-card ${isFeaturedProduct ? 'featured-gold-card' : ''}`}>
      <div className="product-image-box">
        {badgeText && <div className={`product-badge ${isFeaturedProduct ? 'gold-vip-badge' : ''}`}>{badgeText}</div>}
        <Link href={`/product/${product.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={product.image || product.main_image} alt={title} className="product-img" loading="lazy" />
        </Link>
      </div>

      <div className="product-info">
        <h3 className="product-title">
          <Link href={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {title}
          </Link>
        </h3>

        {/* Sizes Selector with Out-of-Stock Status */}
        <div className="sizes-selector">
          <span className="sizes-label">{t('sizesTitle')}</span>
          <div className="sizes-list">
            {sizesList.map(item => {
              const isOut = item.stock <= 0;
              const isSelected = selectedSizeObj?.size === item.size;

              return (
                <button
                  key={item.size}
                  type="button"
                  className={`size-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSizeObj(item)}
                  style={{
                    opacity: isOut ? 0.45 : 1,
                    textDecoration: isOut ? 'line-through' : 'none',
                    borderColor: isOut ? 'rgba(244,63,94,0.4)' : undefined,
                    color: isOut ? '#F43F5E' : undefined
                  }}
                  title={isOut ? 'منتهي الكمية' : `متوفر: ${item.stock}`}
                >
                  {item.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Row */}
        <div className="price-row">
          <div>
            <span className="price-current">{product.price} {currency}</span>
            {(product.oldPrice || product.old_price) && (
              <span className="price-old">{product.oldPrice || product.old_price} {currency}</span>
            )}
          </div>
          <span className="price-note">{priceNote}</span>
        </div>

        {/* Add to Cart Button */}
        <button 
          type="button" 
          className="btn-add-cart" 
          onClick={handleAddToCartClick}
          disabled={isAllOutOfStock || isSelectedOutOfStock}
          style={{
            opacity: (isAllOutOfStock || isSelectedOutOfStock) ? 0.6 : 1,
            cursor: (isAllOutOfStock || isSelectedOutOfStock) ? 'not-allowed' : 'pointer',
            background: (isAllOutOfStock || isSelectedOutOfStock) ? 'rgba(244,63,94,0.2)' : undefined,
            color: (isAllOutOfStock || isSelectedOutOfStock) ? '#F43F5E' : undefined,
            borderColor: (isAllOutOfStock || isSelectedOutOfStock) ? 'rgba(244,63,94,0.4)' : undefined
          }}
        >
          {isAllOutOfStock 
            ? '⚠️ نَفَدَت الكَمّية بالكامل' 
            : (isSelectedOutOfStock ? '⚠️ المقاس غير متوفر' : t('addToCart'))
          }
        </button>

        <Link href={`/product/${product.id}`} className="btn-secondary-link">
          {t('viewDetails')}
        </Link>
      </div>
    </div>
  );
};
