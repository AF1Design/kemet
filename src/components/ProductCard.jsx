'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';

export const ProductCard = ({ product }) => {
  const { lang, addToCart, t } = useApp();
  const [selectedSize, setSelectedSize] = useState('L');

  if (!product) return null;

  const title = lang === 'ar' ? product.nameAr : product.nameEn;
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
    <div className="product-card">
      <div className="product-image-box">
        {badgeText && <div className="product-badge">{badgeText}</div>}
        <Link href={`/product/${product.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={product.image} alt={title} className="product-img" loading="lazy" />
        </Link>
      </div>

      <div className="product-info">
        <h3 className="product-title">
          <Link href={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {title}
          </Link>
        </h3>

        <div className="sizes-selector">
          <span className="sizes-label">{t('sizesTitle')}</span>
          <div className="sizes-list">
            {availableSizes.map(size => (
              <button
                key={size}
                type="button"
                className={`size-pill ${size === selectedSize ? 'active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="price-row">
          <div>
            <span className="price-current">{product.price} {currency}</span>
            {product.oldPrice && <span className="price-old">{product.oldPrice} {currency}</span>}
          </div>
          <span className="price-note">{priceNote}</span>
        </div>

        <button type="button" className="btn-add-cart" onClick={() => addToCart(product, selectedSize)}>
          {t('addToCart')}
        </button>

        <Link href={`/product/${product.id}`} className="btn-secondary-link">
          {t('viewDetails')}
        </Link>
      </div>
    </div>
  );
};
