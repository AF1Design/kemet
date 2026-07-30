import React from 'react';

export const KemetLoader = ({ message = 'جاري التحميل وتجهيز الكولكشن...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '4rem 1rem', 
      minHeight: '320px',
      textAlign: 'center'
    }}>
      {/* The KEMET Winged Emblem Logo ITSELF is the Loading Animation */}
      <div className="kemet-logo-loader-box">
        <img 
          src="/assets/kemet-emblem-icon.png" 
          alt="KEMET Loading Logo" 
          className="kemet-loader-logo-img" 
        />
      </div>

      {/* Loading Status Message */}
      <div style={{ 
        color: 'var(--gold-primary)', 
        fontWeight: 800, 
        fontSize: '1.05rem',
        letterSpacing: '0.5px',
        marginTop: '1.75rem'
      }}>
        {message}
      </div>

      <style>{`
        .kemet-logo-loader-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 800px;
        }

        .kemet-loader-logo-img {
          height: 72px;
          width: auto;
          object-fit: contain;
          animation: kemetLogoPulseFlip 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes kemetLogoPulseFlip {
          0% {
            transform: scale(0.92) rotateY(0deg);
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
            opacity: 0.75;
          }
          50% {
            transform: scale(1.12) rotateY(180deg);
            filter: drop-shadow(0 0 35px rgba(212, 175, 55, 0.9));
            opacity: 1;
          }
          100% {
            transform: scale(0.92) rotateY(360deg);
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  );
};
