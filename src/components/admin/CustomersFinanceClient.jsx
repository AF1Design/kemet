'use client';

import React, { useState, useMemo } from 'react';
import { CustomerFinancialDetailModal } from './CustomerFinancialDetailModal';
import { creditCustomerWalletAction } from '../../app/admin/actions';

export function CustomersFinanceClient({ initialData }) {
  const [customers, setCustomers] = useState(initialData?.customers || []);
  const [stats, setStats] = useState(initialData?.stats || {
    totalCustomers: 0,
    totalRegistered: 0,
    totalWalletBalances: 0,
    totalRevenue: 0,
    totalGiftsIssued: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'with_balance' | 'registered' | 'guests'
  const [sortBy, setSortBy] = useState('balance_desc'); // 'balance_desc' | 'spent_desc' | 'orders_desc' | 'recent'

  // Selected customer for modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Phone Gift Modal
  const [isNewGiftModalOpen, setIsNewGiftModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState(100);
  const [newReason, setNewReason] = useState('هدية ورصيد مشتريات من إدارة KEMET');
  const [isSubmittingNewGift, setIsSubmittingNewGift] = useState(false);
  const [newGiftError, setNewGiftError] = useState(null);

  // Handle Customer Update from modal
  const handleCustomerUpdated = (updatedCustomer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === updatedCustomer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedCustomer;
        return next;
      }
      return [updatedCustomer, ...prev];
    });

    // Recalculate quick stats
    setStats(prev => {
      const totalBal = customers.reduce((acc, c) => acc + (c.id === updatedCustomer.id ? updatedCustomer.currentBalance : c.currentBalance), 0);
      return {
        ...prev,
        totalWalletBalances: totalBal
      };
    });

    setSelectedCustomer(updatedCustomer);
  };

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.orders && c.orders.some(o => String(o.id).includes(q)))
      );
    }

    // 2. Filter Type
    if (filterType === 'with_balance') {
      list = list.filter(c => (c.currentBalance || 0) > 0);
    } else if (filterType === 'registered') {
      list = list.filter(c => c.isRegistered);
    } else if (filterType === 'guests') {
      list = list.filter(c => !c.isRegistered);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'balance_desc') {
        return (b.currentBalance || 0) - (a.currentBalance || 0);
      }
      if (sortBy === 'spent_desc') {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      if (sortBy === 'orders_desc') {
        return (b.ordersCount || 0) - (a.ordersCount || 0);
      }
      if (sortBy === 'recent') {
        const dateA = a.lastOrderDate || a.registeredAt || '1970-01-01';
        const dateB = b.lastOrderDate || b.registeredAt || '1970-01-01';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      return 0;
    });

    return list;
  }, [customers, searchQuery, filterType, sortBy]);

  // Submit New Phone Gift
  const handleCreateNewPhoneGift = async (e) => {
    e.preventDefault();
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setNewGiftError('يرجى إدخال رقم هاتف صحيح مكون من 11 رقماً.');
      return;
    }
    const numAmount = Math.max(0, Math.round(Number(newAmount || 0)));
    if (numAmount <= 0) {
      setNewGiftError('يرجى إدخال مبلغ أكبر من صفر.');
      return;
    }

    setIsSubmittingNewGift(true);
    setNewGiftError(null);

    try {
      const res = await creditCustomerWalletAction({
        phone: cleanPhone,
        customerName: newName.trim(),
        amount: numAmount,
        reason: newReason.trim(),
        giftType: 'general',
        adminName: 'إدارة KEMET'
      });

      if (res.success) {
        setIsNewGiftModalOpen(false);
        setNewPhone('');
        setNewName('');
        setNewAmount(100);

        // Find or create customer in table
        const existingIdx = customers.findIndex(c => c.phone === cleanPhone);
        if (existingIdx >= 0) {
          const updated = {
            ...customers[existingIdx],
            currentBalance: res.balance,
            walletTransactions: [res.transaction, ...(customers[existingIdx].walletTransactions || [])]
          };
          handleCustomerUpdated(updated);
        } else {
          const newCust = {
            id: `p_${cleanPhone}`,
            userId: null,
            name: newName.trim() || `عميل (${cleanPhone})`,
            phone: cleanPhone,
            email: '',
            isRegistered: false,
            registeredAt: null,
            currentBalance: res.balance,
            walletTransactions: [res.transaction],
            orders: [],
            ordersCount: 0,
            totalSpent: 0,
            lastOrderDate: null,
            totalGiftCredited: numAmount,
            totalCreditUsed: 0
          };
          setCustomers(prev => [newCust, ...prev]);
        }
      } else {
        setNewGiftError(res.error || 'فشل إيداع الرصيد.');
      }
    } catch (err) {
      setNewGiftError(err.message || 'حدث خطأ أثناء إيداع الرصيد.');
    } finally {
      setIsSubmittingNewGift(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
            <span className="brand-glow">الحساب المالي للعملاء والمحافظ</span>
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            متابعة شاملة للحسابات المالية لكافة العملاء المسجلين والزوار، إدارة وتصحيح أرصدة الهدايا، واستعراض سجلات الشراء
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewGiftModalOpen(true)}
          style={{
            background: 'var(--gold-gradient)',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.92rem',
            padding: '0.75rem 1.4rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>إيداع رصيد هدية لرقم هاتف جديد</span>
        </button>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stats-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي العملاء</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: 800 }}>[قاعدة البيانات]</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
            {stats.totalCustomers}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            منهم ({stats.totalRegistered}) حساب مسجل
          </span>
        </div>

        <div className="admin-stats-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>أرصدة المحافظ النشطة</span>
            <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 800 }}>[التزام مالي]</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10B981' }}>
            {stats.totalWalletBalances} ج.م
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            رصيد هدايا متاح حالياً للعملاء
          </span>
        </div>

        <div className="admin-stats-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي مبيعات العملاء</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>[مشتريات]</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {stats.totalRevenue} ج.م
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            إجمالي قيمة الطلبات المؤكدة
          </span>
        </div>

        <div className="admin-stats-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي الهدايا الممنوحة</span>
            <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 800 }}>[هدايا ومكافآت]</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F59E0B' }}>
            {stats.totalGiftsIssued} ج.م
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            إجمالي مبالغ الهدايا والتعويضات
          </span>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        
        {/* Search Bar */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل، رقم الهاتف، البريد الإلكتروني، أو رقم الطلب..."
            style={{
              width: '100%',
              padding: '0.75rem 1.1rem',
              fontSize: '0.92rem',
              background: '#020617',
              color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Filter Pills & Sort Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'جميع العملاء' },
              { id: 'with_balance', label: 'أصحاب أرصدة نشطة (> 0)' },
              { id: 'registered', label: 'حسابات مسجلة' },
              { id: 'guests', label: 'طلبات زوار' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                style={{
                  background: filterType === f.id ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterType === f.id ? '#000' : '#CBD5E1',
                  border: filterType === f.id ? '1px solid var(--border-gold-bright)' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: filterType === f.id ? 900 : 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700 }}>ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: '#020617',
                color: '#FFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="balance_desc">أعلى رصيد محفظة أولاً</option>
              <option value="spent_desc">أعلى إنفاق (مشتريات) أولاً</option>
              <option value="orders_desc">الأكثر طلباً أولاً</option>
              <option value="recent">الأحدث تسجيلاً أو نشاطاً</option>
            </select>
          </div>

        </div>

      </div>

      {/* Customers Data Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
            قائمة العملاء والحسابات المالية ({filteredCustomers.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>العميل</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>رقم الهاتف</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>رصيد المحفظة الحالي</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>إجمالي المشتريات</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>عدد الطلبات</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>الهدايا المستلمة</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, textAlign: 'center' }}>إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => {
                  const bal = Number(customer.currentBalance || 0);
                  return (
                    <tr
                      key={customer.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Customer Name & Status */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <strong style={{ color: '#F8FAFC', fontSize: '0.92rem' }}>
                            {customer.name}
                          </strong>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: customer.isRegistered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: customer.isRegistered ? '#10B981' : '#F59E0B'
                          }}>
                            {customer.isRegistered ? 'مسجل' : 'زائر'}
                          </span>
                        </div>
                        {customer.email && (
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', direction: 'ltr', textAlign: 'right', marginTop: '0.15rem' }}>
                            {customer.email}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '1rem', direction: 'ltr', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: '#CBD5E1' }}>
                          {customer.phone || 'بدون هاتف'}
                        </span>
                      </td>

                      {/* Current Balance */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          background: bal > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          color: bal > 0 ? '#10B981' : 'var(--text-secondary)',
                          border: bal > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          {bal} ج.م
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 800, color: '#F1F5F9' }}>
                          {customer.totalSpent || 0} ج.م
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 800, color: '#CBD5E1' }}>
                          {customer.ordersCount || 0} طلب
                        </span>
                      </td>

                      {/* Total Gifts Granted */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold-primary)' }}>
                          {customer.totalGiftCredited || 0} ج.م
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDetailModalOpen(true);
                          }}
                          style={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            border: '1px solid var(--border-gold)',
                            color: 'var(--gold-primary)',
                            padding: '0.45rem 0.95rem',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          عرض الحساب المالي الكامل
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                    لا توجد أي نتائج مطابقة لبحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Financial Detail Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <CustomerFinancialDetailModal
          customer={selectedCustomer}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCustomer(null);
          }}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {/* New Phone Gift Modal */}
      {isNewGiftModalOpen && (
        <div
          onClick={() => setIsNewGiftModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            direction: 'rtl'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0F172A',
              border: '1px solid var(--border-gold)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              color: '#F8FAFC'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                إيداع رصيد هدية لرقم هاتف جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsNewGiftModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 800
                }}
              >
                إغلاق
              </button>
            </div>

            {newGiftError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#F43F5E', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {newGiftError}
              </div>
            )}

            <form onSubmit={handleCreateNewPhoneGift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  رقم الهاتف (11 رقماً):
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', background: '#020617', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  اسم العميل (اختياري):
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم العميل"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', background: '#020617', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.35rem' }}>
                  قيمة الهدية المودعة (ج.م):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '1rem', fontWeight: 900, background: '#020617', color: 'var(--gold-primary)', border: '1px solid var(--border-gold)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  سبب الإهداء:
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.88rem', background: '#020617', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSubmittingNewGift}
                  style={{
                    flexGrow: 1,
                    background: 'var(--gold-primary)',
                    color: '#000',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 900,
                    cursor: isSubmittingNewGift ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingNewGift ? 'جاري الإيداع...' : 'تأكيد الإيداع في المحفظة'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewGiftModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFF',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
