'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export const CartDrawer = () => {
  const { lang, cart, isCartOpen, setIsCartOpen, updateQuantity, t } = useApp();
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
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#090C12'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>{t('cartTitle')}</h3>
          <button 
            type="button"
            style={{ fontSize: '1.8rem', color: 'var(--gold-primary)', lineHeight: 1 }} 
            onClick={() => setIsCartOpen(false)}
          >
            &times;
          </button>
        </div>

        {/* Cart Items Body */}
        <div style={{ 
          padding: '1.25rem', 
          flexGrow: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          background: '#05070B'
        }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <p style={{ fontWeight: 700, marginBottom: '1.5rem', color: '#FFFFFF' }}>{t('cartEmpty')}</p>
              <button type="button" className="btn-primary" onClick={() => setIsCartOpen(false)}>
                {t('cartEmptyBtn')}
              </button>
            </div>
          ) : (
            cart.map(item => {
              const itemPrice = Number(item.price ?? 280);
              const itemTotal = itemPrice * item.quantity;
              const title = lang === 'ar' ? (item.nameAr || item.name_ar || item.nameEn) : (item.nameEn || item.name_en || item.nameAr);
              const itemImg = item.image || item.main_image || '/assets/kemet-hero-banner.jpg';

              return (
                <div 
                  key={`${item.id}-${item.size}`} 
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    background: '#111622', 
                    border: '1px solid var(--border-gold)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.9rem' 
                  }}
                >
                  <img 
                    src={itemImg} 
                    alt={title} 
                    style={{ width: '75px', height: '75px', objectFit: 'cover', background: '#030407', borderRadius: 'var(--radius-sm)' }} 
                  />
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                      {lang === 'ar' ? 'المقاس:' : 'Size:'} <span style={{ background: 'rgba(212,175,55,0.2)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{item.size}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FFFFFF' }}>
                      {itemPrice} {currency} x {item.quantity} = <span style={{ color: 'var(--gold-primary)' }}>{itemTotal} {currency}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, -1)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, 1)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}
                      >
                        +
                      </button>
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
            padding: '1.25rem', 
            borderTop: '1px solid var(--border-color)', 
            background: '#090C12', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cartSubtotal')}</span>
              <span style={{ fontWeight: 800, color: '#FFF' }}>{subtotal} {currency}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>{t('cartShipping')}</span>
              <span style={{ fontWeight: 800, color: 'var(--gold-primary)' }}>+ {estimatedShipping} {currency}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', paddingTop: '0.5rem', borderTop: '1px solid var(--border-gold)' }}>
              <span>{t('cartTotal')}</span>
              <span style={{ color: 'var(--gold-primary)' }}>{totalAmount} {currency}</span>
            </div>

            <button type="button" className="btn-primary" onClick={handleCheckoutClick} style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.25rem' }}>
              {t('cartCheckoutBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
