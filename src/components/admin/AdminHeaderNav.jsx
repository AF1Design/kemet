'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'الإحصائيات', id: 'stats' },
  { href: '/admin#whatsapp', label: '💬 عروض الواتساب', id: 'whatsapp', whatsapp: true },
  { href: '/admin#coupons', label: 'أكواد الخصم', id: 'coupons' },
  { href: '/admin#blacklist', label: 'قائمة الحظر (Blacklist)', id: 'blacklist', danger: true },
  { href: '/admin/products', label: 'المنتجات والمخزون', id: 'products' },
  { href: '/admin/orders', label: 'إدارة الطلبات', id: 'orders' },
  { href: '/admin/customers-finance', label: 'الحساب المالي للعملاء', id: 'finance' },
  { href: '/admin/abandoned-carts', label: 'السلات المتروكة والعملاء', id: 'abandoned', special: true },
  { href: '/', label: 'الواجهة الرئيسية', id: 'home' },
];

export default function AdminHeaderNav() {
  const pathname = usePathname();
  const navRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll boundaries for arrows & visual indicators
  const checkScrollBounds = useCallback(() => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    // In RTL, scrollLeft can be negative or positive depending on browser implementation
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);
    setCanScrollLeft(absScroll < maxScroll - 5);
    setCanScrollRight(absScroll > 5);
  }, []);

  useEffect(() => {
    checkScrollBounds();
    window.addEventListener('resize', checkScrollBounds);
    return () => window.removeEventListener('resize', checkScrollBounds);
  }, [checkScrollBounds]);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - (navRef.current ? navRef.current.offsetLeft : 0));
    setScrollLeftState(navRef.current ? navRef.current.scrollLeft : 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 1.4; // 1.4x scroll acceleration
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    navRef.current.scrollLeft = scrollLeftState - walk;
    checkScrollBounds();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setHasDragged(false), 50);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => setHasDragged(false), 50);
    }
  };

  // Mouse wheel horizontal scroll conversion
  const handleWheel = (e) => {
    if (!navRef.current) return;
    if (e.deltaY !== 0 && !e.shiftKey) {
      // Smoothly scroll horizontally when using vertical mouse wheel
      navRef.current.scrollLeft += e.deltaY;
      checkScrollBounds();
    }
  };

  // Button clicks to step scroll
  const handleStepScroll = (direction) => {
    if (!navRef.current) return;
    const delta = direction === 'left' ? -220 : 220;
    navRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollBounds, 300);
  };

  const isItemActive = (href) => {
    if (href === '/') return false;
    if (href.includes('#')) return false;
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-header-nav-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, maxWidth: '100%' }}>
      {/* Scroll indicator Left button */}
      <button
        type="button"
        aria-label="تمرير لليمين"
        onClick={() => handleStepScroll('right')}
        className="admin-nav-scroll-btn admin-nav-scroll-btn-right"
        style={{
          display: canScrollRight ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid var(--border-gold)',
          color: 'var(--gold-primary)',
          cursor: 'pointer',
          zIndex: 5,
          position: 'absolute',
          right: '-4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          fontSize: '0.8rem',
          fontWeight: 900
        }}
      >
        ›
      </button>

      {/* Main horizontally scrollable track */}
      <nav
        ref={navRef}
        className="admin-nav-scroll"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onScroll={checkScrollBounds}
        style={{
          display: 'flex',
          gap: '0.55rem',
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          paddingBottom: '0.5rem',
          paddingTop: '0.2rem',
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          width: '100%',
          minWidth: 0
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              draggable={false}
              onClick={(e) => {
                // Prevent link navigation if the user was actively dragging
                if (hasDragged) {
                  e.preventDefault();
                }
              }}
              className={`admin-nav-pill ${active ? 'admin-nav-pill-active' : ''} ${item.special && !active ? 'admin-nav-pill-special' : ''}`}
              style={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                padding: '0.45rem 0.95rem',
                fontSize: '0.84rem',
                fontWeight: active || item.special || item.whatsapp || item.danger ? 900 : 700,
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s ease',
                background: active
                  ? 'var(--gold-primary)'
                  : (item.danger
                      ? 'rgba(239, 68, 68, 0.14)'
                      : (item.whatsapp 
                          ? 'rgba(37, 211, 102, 0.14)' 
                          : (item.special ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)'))),
                color: active
                  ? '#000'
                  : (item.danger
                      ? '#EF4444'
                      : (item.whatsapp 
                          ? '#25D366' 
                          : (item.special ? 'var(--gold-primary)' : 'var(--text-primary)'))),
                border: active
                  ? '1px solid var(--gold-primary)'
                  : (item.danger
                      ? '1px solid rgba(239, 68, 68, 0.45)'
                      : (item.whatsapp 
                          ? '1px solid rgba(37, 211, 102, 0.4)' 
                          : (item.special ? '1px solid var(--border-gold)' : '1px solid rgba(255, 255, 255, 0.1)'))),
                boxShadow: active ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Scroll indicator Left button */}
      <button
        type="button"
        aria-label="تمرير لليسار"
        onClick={() => handleStepScroll('left')}
        className="admin-nav-scroll-btn admin-nav-scroll-btn-left"
        style={{
          display: canScrollLeft ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid var(--border-gold)',
          color: 'var(--gold-primary)',
          cursor: 'pointer',
          zIndex: 5,
          position: 'absolute',
          left: '-4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          fontSize: '0.8rem',
          fontWeight: 900
        }}
      >
        ‹
      </button>
    </div>
  );
}
