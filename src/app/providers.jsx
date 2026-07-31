'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { CartDrawer } from '../components/CartDrawer';
import { MobileDrawer } from '../components/MobileDrawer';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { Toast } from '../components/Toast';

const AppShell = ({ children }) => {
  const { toast } = useApp();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdminRoute && <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />}
      
      {!isAdminRoute && (
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <main style={{ flexGrow: 1 }}>
        {children}
      </main>

      {!isAdminRoute && <CartDrawer />}
      {!isAdminRoute && <MobileBottomBar />}
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
