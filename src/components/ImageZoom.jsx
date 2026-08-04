'use client';

import React, { useState, useRef, useEffect } from 'react';

export const ImageZoom = ({ src, alt }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalScale, setModalScale] = useState(1.5);
  const containerRef = useRef(null);

  // Desktop Mouse Move Handler with Clamped Boundaries (0% to 100%)
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - left) / width) * 100;
    const rawY = ((e.clientY - top) / height) * 100;
    const x = Math.max(0, Math.min(100, rawX));
    const y = Math.max(0, Math.min(100, rawY));
    setPosition({ x, y });
  };

  // Mobile Touch Move Handler with Clamped Boundaries (0% to 100%)
  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const rawX = ((touch.clientX - left) / width) * 100;
    const rawY = ((touch.clientY - top) / height) * 100;
    const x = Math.max(0, Math.min(100, rawX));
    const y = Math.max(0, Math.min(100, rawY));
    setPosition({ x, y });
  };

  // Prevent background body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="zoom-container-outer">
        <div 
          ref={containerRef}
          className="zoom-image-wrapper"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsZoomed(true)}
          onTouchEnd={() => setIsZoomed(false)}
          onTouchMove={handleTouchMove}
          onClick={() => setIsModalOpen(true)}
          style={{ cursor: 'zoom-in', touchAction: 'pan-y' }}
        >
          <img 
            src={src} 
            alt={alt} 
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="zoom-img-base"
            style={{
              transformOrigin: `${position.x}% ${position.y}%`,
              transform: isZoomed ? 'scale(2.4)' : 'scale(1)',
              transition: isZoomed ? 'transform-origin 0.05s ease-out, transform 0.2s ease-out' : 'transform 0.25s ease-out',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          
          {/* Subtle magnifying indicator badge */}
          <div 
            className={`zoom-hint-badge ${isZoomed ? 'zoomed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            style={{ cursor: 'pointer', zIndex: 5 }}
          >
            🔍 {isZoomed ? 'انقر لتكبير الشاشة بالكامل' : 'انقر أو مرر للتكبير والتفاصيل'}
          </div>
        </div>
      </div>

      {/* Fullscreen Mobile & Desktop Lightbox Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          {/* Top Bar Controls */}
          <div 
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              right: '1rem',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              zIndex: 1000000,
              pointerEvents: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.4)' }}>
              🔍 زوم مكبّر ({Math.round(modalScale * 100)}%)
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setModalScale(prev => Math.min(3.5, prev + 0.5))}
                style={{ background: 'var(--bg-card)', border: '1px solid #D4AF37', color: '#FFF', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                +
              </button>

              <button 
                type="button" 
                onClick={() => setModalScale(prev => Math.max(1, prev - 0.5))}
                style={{ background: 'var(--bg-card)', border: '1px solid #D4AF37', color: '#FFF', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                -
              </button>

              <button 
                type="button" 
                onClick={() => setModalScale(1)}
                style={{ background: 'var(--bg-card)', border: '1px solid #D4AF37', color: '#D4AF37', padding: '0 0.8rem', height: '40px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
              >
                إعادة ضبط 🔄
              </button>

              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                style={{ background: '#F43F5E', border: 'none', color: '#FFF', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', marginLeft: '0.5rem' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Main Image Container */}
          <div 
            style={{ 
              width: '100%', 
              height: '85vh', 
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center', 
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={src} 
              alt={alt} 
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transform: `scale(${modalScale})`,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: modalScale > 1 ? 'grab' : 'zoom-in'
              }}
              onClick={() => setModalScale(prev => (prev === 1 ? 2.2 : 1))}
            />
          </div>

          <div style={{ position: 'absolute', bottom: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textAlign: 'center' }}>
            💡 اضغط على الصورة للتكبير التلقائي أو استخدم الأزرار بأعلى الشاشة
          </div>
        </div>
      )}
    </>
  );
};
