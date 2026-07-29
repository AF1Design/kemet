'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const AnimatedLogo = () => {
  const [activeLogo, setActiveLogo] = useState('emblem');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogo((prev) => (prev === 'emblem' ? 'wordmark' : 'emblem'));
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/" className="brand-logo-animated-wrapper" title="KEMET Home">
      <div className="animated-logo-container">
        {/* Emblem Logo */}
        <img
          src="/assets/kemet-emblem-icon.png"
          alt="KEMET Emblem"
          className={`brand-emblem animated-logo-item ${activeLogo === 'emblem' ? 'active' : ''}`}
        />

        {/* Wordmark Logo */}
        <img
          src="/assets/kemet-text-logo.png"
          alt="KEMET Wordmark"
          className={`brand-text-img animated-logo-item ${activeLogo === 'wordmark' ? 'active' : ''}`}
        />
      </div>
    </Link>
  );
};
