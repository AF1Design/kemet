'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { CartDrawer } from '../components/CartDrawer';
import { MobileDrawer } from '../components/MobileDrawer';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { Toast } from '../components/Toast';

const AppShell = ({ children }) => {
  const { toast } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <main style={{ flexGrow: 1 }}>
        {children}
      </main>

      <CartDrawer />
      <MobileBottomBar />
      {toast && <Toast message={toast} />}
    </div>
  );
};

export function Providers({ children }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
