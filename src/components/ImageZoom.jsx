import React, { useState, useRef } from 'react';

export const ImageZoom = ({ src, alt }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((touch.clientX - left) / width) * 100;
    const y = ((touch.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
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
      >
        <img 
          src={src} 
          alt={alt} 
          className="zoom-img-base"
          style={{
            transformOrigin: `${position.x}% ${position.y}%`,
            transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
          }}
        />
        
        {/* Subtle magnifying indicator badge */}
        <div className={`zoom-hint-badge ${isZoomed ? 'zoomed' : ''}`}>
          🔍 {isZoomed ? 'جاري التكبير والتدقيق 2.5x' : 'مرر الماوس أو اللمس للتكبير والتدقيق'}
        </div>
      </div>
    </div>
  );
};
