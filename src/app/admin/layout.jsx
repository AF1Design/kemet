process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { getAdminSupabase } from '../../lib/supabase/admin.js';

export default async function AdminLayout({ children }) {
  let isAdmin = false;

  try {
    const cookieStore = cookies();
    let token = cookieStore.get('sb-access-token')?.value || cookieStore.get('supabase-auth-token')?.value;

    // Fallback: Check Authorization header if token not in cookieStore
    if (!token) {
      const headerList = headers();
      const authHeader = headerList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('🔒 AdminGuard: No token found in cookies or Auth header');
      redirect('/login');
    }

    const supabaseAdmin = getAdminSupabase();

    // 1. Verify current user session via JWT token
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      console.error('🔒 AdminGuard: Token verification failed:', userErr?.message);
      redirect('/login');
    }

    // 2. Query profile specifically for THIS verified user.id
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      console.error('🔒 AdminGuard: Profile fetch error:', profileErr.message);
    }

    if (!profileErr && profile && profile.role === 'admin') {
      isAdmin = true;
      console.log('👑 AdminGuard: User', user.email, 'verified as ADMIN!');
    } else {
      console.log('🔒 AdminGuard: User', user.email, 'has role:', profile?.role);
    }
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('Error verifying admin in layout guard:', err);
  }

  // 3. Strict SSR Security Guard: Redirect non-admins to login page immediately before HTML streaming
  if (!isAdmin) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* Top Admin Navigation Bar */}
      <header style={{ 
        background: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-gold-bright)', 
        padding: '1rem 2rem',
        boxShadow: 'var(--shadow-glow)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👑</span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                لوحة تحكم KEMET الإدارية
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
                ● وضع الإدارة المعزول والأمني (Admin System Active)
              </span>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/admin" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              📊 الإحصائيات
            </Link>
            <Link href="/admin/products" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              ⚽ إدارة المنتجات والمخزون
            </Link>
            <Link href="/" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}>
              🛍️ العودة للمتجر
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main style={{ padding: '2.5rem 0' }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
