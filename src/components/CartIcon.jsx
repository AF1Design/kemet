import React from 'react';

export const CartIcon = ({ className = '', size = 48 }) => {
  return (
    <img 
      src="/assets/kemet-cart-icon.png" 
      alt="سلة التسوق KEMET" 
      width={size} 
      height={size} 
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        height: 'auto',
        maxHeight: `${size}px`,
        width: 'auto',
        maxWidth: `${size * 1.6}px`,
        filter: 'drop-shadow(0 3px 10px rgba(212, 175, 55, 0.45))',
        transition: 'transform 0.2s ease, filter 0.2s ease'
      }}
    />
  );
};
