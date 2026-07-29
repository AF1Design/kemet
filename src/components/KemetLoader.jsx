import React from 'react';
import { AnimatedLogo } from './AnimatedLogo';

export const KemetLoader = ({ message = 'جاري البحث وتجهيز المنتجات...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '4rem 1rem', 
      minHeight: '300px',
      textAlign: 'center'
    }}>
      <div style={{ 
        position: 'relative', 
        marginBottom: '1.5rem',
        animation: 'kemetPulseGlow 1.5s ease-in-out infinite alternate' 
      }}>
        <AnimatedLogo />
      </div>

      {/* Golden Spinner Circle */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(212, 175, 55, 0.2)',
        borderTop: '3px solid var(--gold-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '1rem'
      }}></div>

      <div style={{ 
        color: 'var(--gold-primary)', 
        fontWeight: 800, 
        fontSize: '1rem',
        letterSpacing: '0.3px'
      }}>
        {message}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes kemetPulseGlow {
          0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(212,175,55,0.2)); }
          100% { transform: scale(1.08); filter: drop-shadow(0 0 20px rgba(212,175,55,0.6)); }
        }
      `}</style>
    </div>
  );
};
