'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

// Helper to resolve exact database variants and sizes for a cart item
function getAvailableSizesForItem(item) {
  // 1. Check if product_variants or variants array exists
  const variants = item.product_variants || item.variants || [];
  if (Array.isArray(variants) && variants.length > 0) {
    return variants.map(v => ({
      size: typeof v === 'string' ? v : v.size,
      stock: typeof v === 'object' && v !== null ? Number(v.stock_quantity ?? v.stock ?? 50) : 50
    }));
  }

  // 2. Check if item.sizes exists
  if (Array.isArray(item.sizes) && item.sizes.length > 0) {
    return item.sizes.map(s => {
      if (typeof s === 'object' && s !== null) {
        return { size: s.size, stock: Number(s.stock ?? s.stock_quantity ?? 50) };
      }
      return { size: s, stock: 50 };
    });
  }

  // 3. Fallback to the item's own selected size if no other variants are defined
  if (item.size) {
    return [{ size: item.size, stock: 50 }];
  }

  return [
    { size: 'M', stock: 50 },
    { size: 'L', stock: 50 },
    { size: 'XL', stock: 50 },
    { size: 'XXL', stock: 50 }
  ];
}

export const CartDrawer = () => {
  const { 
    lang, 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    updateItemSize, 
    removeFromCart, 
    showToast,
    t 
  } = useApp();
  const router = useRouter();

  if (!isCartOpen) return null;

  const currency = t('currency');
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price ?? 280) * item.quantity, 0);
  const estimatedShipping = 50;
  const totalAmount = subtotal + estimatedShipping;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="cart-drawer-overlay active" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        
        {/* Cart Drawer Header */}
        <div style={{ 
          padding: '1.4rem 1.6rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🛍️</span>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {t('cartTitle')}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                ({cart.reduce((total, item) => total + item.quantity, 0)} {lang === 'ar' ? 'قطع في السلة' : 'items'})
              </span>
            </div>
          </div>
          
          <button 
            type="button"
            style={{ 
              fontSize: '1.5rem', 
              color: 'var(--text-secondary)', 
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
              transition: 'all 0.2s ease'
            }} 
            onClick={() => setIsCartOpen(false)}
            aria-label="Close Cart"
          >
            &times;
          </button>
        </div>

        {/* Cart Items Body */}
        <div style={{ 
          padding: '1.4rem 1.6rem', 
          flexGrow: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.2rem',
          background: 'var(--bg-deep)'
        }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem' }}>🛒</div>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {t('cartEmpty')}
              </p>
              <button type="button" className="btn-primary" onClick={() => setIsCartOpen(false)} style={{ padding: '0.75rem 2rem' }}>
                {t('cartEmptyBtn')}
              </button>
            </div>
          ) : (
            cart.map(item => {
              const itemPrice = Number(item.price ?? 280);
              const itemTotal = itemPrice * item.quantity;
              const title = lang === 'ar' ? (item.nameAr || item.name_ar || item.nameEn) : (item.nameEn || item.name_en || item.nameAr);
              const itemImg = item.image || item.main_image || '/assets/kemet-hero-banner.jpg';
              const availableSizes = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : STANDARD_SIZES;

              return (
                <div 
                  key={`${item.id}-${item.size}`} 
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-gold)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '1.2rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Row: Product Image + Title & Delete Button */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <img 
                      src={itemImg} 
                      alt={title} 
                      style={{ 
                        width: '82px', 
                        height: '82px', 
                        objectFit: 'cover', 
                        background: '#000', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        flexShrink: 0
                      }} 
                    />

                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{ 
                          fontSize: '0.98rem', 
                          fontWeight: 800, 
                          color: 'var(--text-primary)', 
                          lineHeight: 1.4,
                          margin: 0
                        }}>
                          {title}
                        </h4>
                        
                        {/* Delete / Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.size)}
                          title={lang === 'ar' ? 'حذف المنتج من السلة' : 'Remove from cart'}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#EF4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>✕</span>
                          <span>{lang === 'ar' ? 'حذف' : 'Remove'}</span>
                        </button>
                      </div>

                      <div style={{ 
                        fontSize: '1.05rem', 
                        fontWeight: 900, 
                        color: 'var(--gold-primary)', 
                        marginTop: '0.4rem',
                        fontFamily: 'var(--font-en)'
                      }}>
                        {itemPrice} {currency}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Size Selector (تعديل المقاس) */}
                  <div style={{ 
                    padding: '0.65rem 0.85rem', 
                    background: 'rgba(212, 175, 55, 0.06)', 
                    border: '1px dashed var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      🏷️ {lang === 'ar' ? 'المقاس المختار:' : 'Selected Size:'}
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {availableSizes.map((szObj) => {
                        const szName = szObj.size;
                        const isOutOfStock = szObj.stock <= 0;
                        const isCurrent = item.size === szName;

                        return (
                          <button
                            key={szName}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => {
                              if (isOutOfStock) {
                                showToast(lang === 'ar' ? `⚠️ مقاس (${szName}) منتهي الكمية حالياً` : `⚠️ Size (${szName}) is out of stock`);
                                return;
                              }
                              updateItemSize(item.id, item.size, szName);
                            }}
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '4px',
                              border: isCurrent 
                                ? '1.5px solid var(--gold-primary)' 
                                : (isOutOfStock ? '1px dashed rgba(244,63,94,0.4)' : '1px solid var(--border-color)'),
                              background: isCurrent 
                                ? 'var(--gold-gradient)' 
                                : (isOutOfStock ? 'rgba(244,63,94,0.08)' : 'var(--bg-card)'),
                              color: isCurrent 
                                ? '#000000' 
                                : (isOutOfStock ? '#F43F5E' : 'var(--text-secondary)'),
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              opacity: isOutOfStock ? 0.45 : 1,
                              textDecoration: isOutOfStock ? 'line-through' : 'none',
                              fontFamily: 'var(--font-en)',
                              transition: 'all 0.15s ease',
                              boxShadow: isCurrent ? '0 2px 8px var(--gold-glow)' : 'none'
                            }}
                            title={isOutOfStock ? (lang === 'ar' ? 'المقاس منتهي الكمية' : 'Out of stock') : undefined}
                          >
                            {szName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Row: Quantity Modifier & Line Item Total (تعديل العدد + الإجمالي) */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginInlineEnd: '0.2rem' }}>
                        {lang === 'ar' ? 'الكمية:' : 'Qty:'}
                      </span>
                      
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, -1)}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '6px', 
                          border: '1px solid var(--border-gold)',
                          background: 'var(--bg-deep)', 
                          color: 'var(--text-primary)', 
                          fontWeight: 900, 
                          fontSize: '1.1rem', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ 
                        fontWeight: 900, 
                        color: 'var(--text-primary)', 
                        minWidth: '24px', 
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-en)'
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, 1)}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '6px', 
                          border: '1px solid var(--border-gold)',
                          background: 'var(--bg-deep)', 
                          color: 'var(--text-primary)', 
                          fontWeight: 900, 
                          fontSize: '1.1rem', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Total For this Item */}
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {lang === 'ar' ? 'إجمالي القطع' : 'Total'}
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'var(--font-en)' }}>
                        {itemTotal} {currency}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Cart Drawer Footer */}
        {cart.length > 0 && (
          <div style={{ 
            padding: '1.4rem 1.6rem', 
            borderTop: '1px solid var(--border-color)', 
            background: 'var(--bg-card)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.85rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('cartSubtotal')}</span>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>{subtotal} {currency}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('cartShipping')}</span>
              <span style={{ fontWeight: 800, color: 'var(--gold-primary)', fontFamily: 'var(--font-en)' }}>+ {estimatedShipping} {currency}</span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '1.25rem', 
              fontWeight: 900, 
              color: 'var(--text-primary)', 
              paddingTop: '0.85rem', 
              borderTop: '1px solid var(--border-gold)' 
            }}>
              <span>{t('cartTotal')}</span>
              <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-en)', textShadow: '0 0 10px var(--gold-glow)' }}>
                {totalAmount} {currency}
              </span>
            </div>

            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleCheckoutClick} 
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1.05rem', 
                fontWeight: 900,
                marginTop: '0.4rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {t('cartCheckoutBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
