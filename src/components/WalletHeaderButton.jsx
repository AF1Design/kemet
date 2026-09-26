'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { getCustomerWalletAction } from '../app/admin/actions';

export function WalletHeaderButton({ isMobile = false }) {
  const { user, lang } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState(null);
  const [guestPhone, setGuestPhone] = useState(null);
  const [guestLookupDone, setGuestLookupDone] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const containerRef = useRef(null);

  // Sync wallet balance and transaction ledger
  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialBalance() {
      let candidatePhone = user?.phone || null;
      if (!candidatePhone && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kemet_guest_wallet_phone');
          if (stored) {
            candidatePhone = stored;
            if (!isCancelled) setGuestPhone(stored);
          }
        } catch (e) {}
      }

      if (!user?.id && !candidatePhone) {
        if (!isCancelled) {
          setWalletBalance(0);
          setTransactions([]);
        }
        return;
      }

      if (!isCancelled) setIsLoading(true);
      try {
        const res = await getCustomerWalletAction({
          userId: user?.id || null,
          phone: candidatePhone || null,
          email: user?.email || null
        });

        if (!isCancelled && res.success && res.wallet) {
          setWalletBalance(Math.max(0, Number(res.wallet.balance || 0)));
          setTransactions(Array.isArray(res.wallet.transactions) ? res.wallet.transactions : []);
        }
      } catch (err) {
        console.warn('WalletHeaderButton note:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchInitialBalance();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle guest phone check
  const handleCheckGuestPhone = async (e) => {
    e.preventDefault();
    const cleanDigits = phoneInput.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح مكون من 11 رقماً.');
      return;
    }

    setPhoneError(null);
    setIsCheckingPhone(true);
    setGuestLookupDone(false);

    try {
      const res = await getCustomerWalletAction({ phone: cleanDigits });
      if (res.success && res.wallet) {
        const balance = Math.max(0, Number(res.wallet.balance || 0));
        setWalletBalance(balance);
        setTransactions(Array.isArray(res.wallet.transactions) ? res.wallet.transactions : []);
        setGuestPhone(cleanDigits);
        setGuestLookupDone(true);
        try {
          localStorage.setItem('kemet_guest_wallet_phone', cleanDigits);
        } catch (e) {}
      } else {
        setWalletBalance(0);
        setTransactions([]);
        setGuestLookupDone(true);
      }
    } catch (err) {
      setPhoneError('حدث خطأ أثناء فحص الرصيد. يرجى المحاولة مجدداً.');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleResetGuestPhone = () => {
    try {
      localStorage.removeItem('kemet_guest_wallet_phone');
    } catch (e) {}
    setGuestPhone(null);
    setPhoneInput('');
    setGuestLookupDone(false);
    setWalletBalance(0);
    setTransactions([]);
  };

  return (
    <div className={`wallet-header-wrapper ${isMobile ? 'mobile-only' : 'desktop-only'}`} ref={containerRef} style={{ position: 'relative' }}>
      {/* Header Button - Ultra-Compact: Wallet Icon + Small Balance Badge (Zero long text) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`action-icon-btn ${walletBalance > 0 ? 'wallet-active-badge' : ''}`}
        title={lang === 'ar' ? (walletBalance > 0 ? `محفظة الهدايا (${walletBalance} ج.م)` : 'محفظة الهدايا') : (walletBalance > 0 ? `Gift Wallet (${walletBalance} EGP)` : 'Gift Wallet')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: walletBalance > 0 ? '0.35rem' : '0',
          background: walletBalance > 0 ? 'rgba(212, 175, 55, 0.16)' : 'var(--bg-card)',
          border: walletBalance > 0 ? '1px solid var(--border-gold-bright)' : '1px solid var(--border-color)',
          padding: walletBalance > 0 ? '0.4rem 0.65rem' : '0.45rem',
          minWidth: walletBalance > 0 ? 'auto' : '36px',
          height: '36px',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          color: walletBalance > 0 ? 'var(--gold-primary)' : 'var(--text-primary)',
          transition: 'all 0.2s ease',
          boxShadow: walletBalance > 0 ? '0 0 10px rgba(212, 175, 55, 0.25)' : 'none'
        }}
      >
        {/* Luxury Wallet SVG Icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: walletBalance > 0 ? 'var(--gold-primary)' : 'currentColor', flexShrink: 0 }}
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>

        {/* Small Sleek Amount Badge - Only when balance > 0, NO redundant text */}
        {walletBalance > 0 && (
          <span style={{
            fontWeight: 900,
            fontSize: '0.8rem',
            color: 'var(--gold-primary)',
            whiteSpace: 'nowrap',
            lineHeight: 1
          }}>
            {walletBalance} ج.م
          </span>
        )}
      </button>

      {/* Backdrop for outside click / mobile focus */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: isMobile ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
            zIndex: 99998
          }}
        />
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '70px' : 'calc(100% + 10px)',
            left: isMobile ? '1rem' : (lang === 'ar' ? '0' : 'auto'),
            right: isMobile ? '1rem' : (lang === 'ar' ? 'auto' : '0'),
            width: isMobile ? 'calc(100vw - 2rem)' : '370px',
            maxWidth: '400px',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: '#0F172A',
            border: '1px solid var(--border-gold)',
            borderRadius: '14px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
            padding: '1.25rem',
            zIndex: 99999,
            direction: 'rtl',
            textAlign: 'right',
            color: '#F8FAFC'
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(212, 175, 55, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-primary)'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                محفظة رصيد الهدايا والمشتريات
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#FFF',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 900
              }}
              title="إغلاق"
            >
              &times;
            </button>
          </div>

          {/* User Logged-In View */}
          {user ? (
            <div>
              {/* Balance Card */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '10px',
                padding: '1rem',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.3rem', fontWeight: 700 }}>
                  رصيد المحفظة المتاح حالياً:
                </span>
                <strong style={{ fontSize: '1.65rem', fontWeight: 900, color: walletBalance > 0 ? '#10B981' : 'var(--gold-primary)' }}>
                  {walletBalance} ج.م
                </strong>
                {walletBalance > 0 && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: '1.5' }}>
                    يمكنك خصم هذا الرصيد بالكامل من قيمة طلبك القادم في صفحة إتمام الطلب (Checkout).
                  </p>
                )}
              </div>

              {/* Transactions Ledger (Shows order compensation or occasion gift details) */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>سجل العمليات والتعويضات:</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>({transactions.length} حركة)</span>
                </div>

                {transactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto', paddingLeft: '0.2rem' }}>
                    {transactions.map((txn, idx) => (
                      <div
                        key={txn.id || idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{
                            fontWeight: 900,
                            color: (txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? '#10B981' : '#F43F5E',
                            direction: 'ltr',
                            display: 'inline-block'
                          }}>
                            {(txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? `+${txn.amount} ج.م` : `-${txn.amount} ج.م`}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('ar-EG') : ''}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#E2E8F0', lineHeight: '1.4' }}>
                          {txn.reason || (txn.type === 'credit' ? 'إيداع رصيد هدية / تعويض' : 'استخدام في طلب')}
                        </div>
                        {txn.orderId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', marginTop: '0.2rem', fontWeight: 700 }}>
                            مرجع الطلب: #{txn.orderId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '0.85rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#94A3B8'
                  }}>
                    لا توجد حركات مسجلة في محفظتك حتى الآن.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  href="/category/all"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'var(--gold-primary)',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '0.86rem',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  {walletBalance > 0 ? 'تسوق الآن واستخدم رصيدك' : 'تصفح أحدث المنتجات'}
                </Link>

                <Link
                  href="/my-orders"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  عرض تفاصيل حسابي والطلبات
                </Link>
              </div>
            </div>
          ) : (
            /* Guest User View */
            <div>
              {guestPhone ? (
                <div>
                  <div style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '10px',
                    padding: '1rem',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '0.2rem' }}>
                      الرقم المسجل: <strong style={{ color: '#FFF', direction: 'ltr', display: 'inline-block' }}>{guestPhone}</strong>
                    </span>
                    <strong style={{ fontSize: '1.65rem', fontWeight: 900, color: walletBalance > 0 ? '#10B981' : 'var(--gold-primary)' }}>
                      {walletBalance} ج.م
                    </strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: '1.5' }}>
                      {walletBalance > 0
                        ? 'رصيدك المهدى جاهز، وسيتم خصمه تلقائياً عند طلبك برقم هاتفك.'
                        : 'لا يوجد رصيد هدايا مسجل لهذا الرقم حالياً.'}
                    </p>
                  </div>

                  {/* Guest Transactions Ledger */}
                  {transactions.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                        سجل حركات الرصيد للرقم:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
                        {transactions.map((txn, idx) => (
                          <div
                            key={txn.id || idx}
                            style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '0.6rem 0.75rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{
                                fontWeight: 900,
                                color: (txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? '#10B981' : '#F43F5E',
                                direction: 'ltr',
                                display: 'inline-block'
                              }}>
                                {(txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? `+${txn.amount} ج.م` : `-${txn.amount} ج.م`}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('ar-EG') : ''}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, color: '#E2E8F0' }}>
                              {txn.reason || (txn.type === 'credit' ? 'إيداع رصيد هدية / تعويض' : 'استخدام في طلب')}
                            </div>
                            {txn.orderId && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', marginTop: '0.2rem', fontWeight: 700 }}>
                                مرجع الطلب: #{txn.orderId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {walletBalance > 0 && (
                      <Link
                        href="/category/all"
                        onClick={() => setIsOpen(false)}
                        style={{
                          background: 'var(--gold-primary)',
                          color: '#000',
                          fontWeight: 900,
                          fontSize: '0.86rem',
                          padding: '0.65rem',
                          borderRadius: '8px',
                          textAlign: 'center',
                          textDecoration: 'none'
                        }}
                      >
                        تسوق الآن واستخدم رصيدك
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleResetGuestPhone}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#94A3B8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      استعلام برقم هاتف آخر
                    </button>
                  </div>
                </div>
              ) : (
                /* Guest Phone Lookup Form */
                <div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#CBD5E1', lineHeight: '1.5' }}>
                    هل حصلت على رصيد هدية أو تعويض من KEMET؟ أدخل رقم هاتفك للاستعلام عن رصيدك وسجل حركاتك:
                  </p>

                  <form onSubmit={handleCheckGuestPhone} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    />

                    {phoneError && (
                      <div style={{ color: '#F43F5E', fontSize: '0.78rem', fontWeight: 700 }}>
                        {phoneError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isCheckingPhone || !phoneInput.trim()}
                      style={{
                        background: 'var(--gold-primary)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: (isCheckingPhone || !phoneInput.trim()) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCheckingPhone ? 'جاري فحص الرصيد...' : 'عرض رصيد الهدية'}
                    </button>
                  </form>
                </div>
              )}

              {/* Login Link */}
              <div style={{ marginTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.75rem', textAlign: 'center' }}>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
                >
                  أو قم بتسجيل الدخول إلى حسابك المسجل
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
