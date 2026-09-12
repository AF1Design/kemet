'use client';

import React, { useState, useEffect } from 'react';
import { getAbandonedCartsAction } from '../../app/admin/actions';

export function AbandonedCartsControl({
  initialAbandonedCarts = [],
  initialRegisteredLeads = [],
  initialStats = {}
}) {
  const [abandonedCarts, setAbandonedCarts] = useState(initialAbandonedCarts);
  const [registeredLeads, setRegisteredLeads] = useState(initialRegisteredLeads);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState('carts'); // 'carts' | 'leads'
  const [leadFilter, setLeadFilter] = useState('active_only'); // 'active_only' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time automatic background polling every 12 seconds from Supabase
  useEffect(() => {
    setLastUpdatedTime(new Date().toLocaleTimeString('ar-EG'));

    const interval = setInterval(async () => {
      try {
        const res = await getAbandonedCartsAction();
        if (res.success) {
          setAbandonedCarts(res.abandonedCarts || []);
          setRegisteredLeads(res.registeredLeads || []);
          setStats(res.stats || {});
          setLastUpdatedTime(new Date().toLocaleTimeString('ar-EG'));
        }
      } catch (e) {}
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAbandonedCartsAction();
      if (res.success) {
        setAbandonedCarts(res.abandonedCarts || []);
        setRegisteredLeads(res.registeredLeads || []);
        setStats(res.stats || {});
        setLastUpdatedTime(new Date().toLocaleTimeString('ar-EG'));
        showToast('تم تحديث البيانات مباشرة من السيرفر');
      } else {
        showToast('حدث خطأ أثناء تحديث البيانات');
      }
    } catch (err) {
      showToast('تعذر الاتصال بالخادم');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatEgyptianPhone = (rawPhone) => {
    if (!rawPhone) return '';
    const digits = String(rawPhone).replace(/\D/g, '');
    if (digits.startsWith('20')) return digits;
    if (digits.startsWith('0')) return '2' + digits;
    if (digits.length === 10) return '20' + digits;
    return '20' + digits;
  };

  const buildAiWhatsAppMessage = (name) => {
    const cleanName = (name || 'عزيزنا العميل').trim();
    return `مرحباً ${cleanName}، انا الـAi الخاص بـKemetmisr Store \nلاحظنا قيامك بإنشاء حساب في متجرنا، ولم تستكمل الطلب\n ويسعدنا تقديم كود خصم خاص لطلبك الأول\n\n kemet22 (القطعة بـ 290 ج.م فقط) \n\nأو kemetmisr (القطعتين بـ 450 ج.م).\n\nهل تحتاج لأي استفسار حول المقاسات أو خامة المنتجات؟\n\nhttps://www.kemetmisr.com/`;
  };

  const getWhatsAppCartUrl = (cart) => {
    const phone = formatEgyptianPhone(cart.customerPhone);
    if (!phone) return null;
    const msg = buildAiWhatsAppMessage(cart.customerName);
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const getWhatsAppLeadUrl = (lead) => {
    const phone = formatEgyptianPhone(lead.phone);
    if (!phone) return null;
    const msg = buildAiWhatsAppMessage(lead.fullName);
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const filteredCarts = abandonedCarts.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.customerPhone || '').includes(q) ||
      (c.customerEmail || '').toLowerCase().includes(q) ||
      (c.governorate || '').toLowerCase().includes(q)
    );
  });

  const filteredLeads = registeredLeads.filter(l => {
    // Sub-filter
    if (leadFilter === 'active_only') {
      const hasCart = Boolean(l.cart);
      const advancedStage = Boolean(l.stage && (l.stage.includes('السلة') || l.stage.includes('العنوان') || l.stage.includes('محافظة')));
      if (!hasCart && !advancedStage) return false;
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (l.fullName || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.governorate || '').toLowerCase().includes(q) ||
      (l.address || '').toLowerCase().includes(q) ||
      (l.stage || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Toast notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10B981',
          color: '#000',
          padding: '0.85rem 1.75rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 800,
          zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--bg-card)',
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0, marginBottom: '0.35rem' }}>
            متابعة السلات المتروكة والعملاء الذين لم يتمموا الشراء
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            رصد لحظي وتلقائي للعملاء الذين اختاروا منتجات ووصلوا لمراحل الشراء وتوقفوا قبل التأكيد.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
              تحديث تلقائي مستمر {lastUpdatedTime ? `(${lastUpdatedTime})` : ''}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isRefreshing ? 'wait' : 'pointer'
            }}
          >
            {isRefreshing ? 'جاري الفحص...' : 'تحديث يدوي الآن'}
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>السلات المتروكة النشطة</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 800, border: '1px solid var(--gold-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>تلقائي</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
            {stats.abandonedCartsCount ?? abandonedCarts.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>عملاء لديهم منتجات معلقة في السلة</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>القيمة التقديرية المعلقة</span>
            <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 800, border: '1px solid #F59E0B', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>محتملة</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F59E0B' }}>
            {(stats.potentialRevenue ?? 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700 }}>ج.م</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>إجمالي قيمة المنتجات المتروكة</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>حسابات مسجلة لم تطلب بعد</span>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 800, border: '1px solid #3B82F6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>حسابات</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#3B82F6' }}>
            {stats.registeredLeadsCount ?? registeredLeads.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>مسجلين لم ينشئوا أي طلب مكتمل</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>معدل التحويل الكلي</span>
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, border: '1px solid #10B981', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>تحويل</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10B981' }}>
            {stats.conversionRate || '0%'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {stats.buyersCount ?? 0} مشتري من أصل {stats.totalAccounts ?? 0} حساب مسجل
          </span>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('carts')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'carts' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'carts' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            السلات المتروكة النشطة ({abandonedCarts.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'leads' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'leads' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            العملاء المسجلين وتوقفهم ({registeredLeads.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، المحافظة أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'carts' ? (
        /* SECTION 1: ACTIVE ABANDONED CARTS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredCarts.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 2rem',
              textAlign: 'center'
            }}>
              <div style={{ display: 'inline-block', padding: '0.4rem 0.9rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 800, fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid #10B981' }}>
                نظام الرصد التلقائي اللحظي متصل ونشط
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: 0, marginBottom: '0.6rem', fontWeight: 900 }}>
                لا توجد سلات متروكة معلقة في هذه اللحظة
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '600px', marginInline: 'auto', lineHeight: 1.6 }}>
                هذه القائمة ديناميكية ومربوطة مباشرة بالسيرفر: بمجرد قيام أي عميل باختيار أي تيشيرت وعدم إتمام الشراء، ستظهر هنا فوراً وتلقائياً باسمه ورقم هاتفه وصور التيشيرتات ومقاساتها وقيمتها وتوقيتها دون أي تدخل منك، وتختفي تلقائياً بمجرد إتمام طلبه.
              </p>
            </div>
          ) : (
            filteredCarts.map((cart, idx) => {
              const waUrl = getWhatsAppCartUrl(cart);
              return (
                <div
                  key={cart.userId || cart.customerPhone || idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  {/* Cart Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                          {cart.customerName || 'عميل مسجل'}
                        </h3>
                        {cart.customerPhone && (
                          <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 800, direction: 'ltr' }}>
                            {cart.customerPhone}
                          </span>
                        )}
                        {cart.governorate && (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)', border: '1px solid var(--gold-primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            {cart.governorate}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {cart.customerEmail && <span>البريد: {cart.customerEmail}</span>}
                        <span>آخر تواجد: <strong style={{ color: 'var(--text-primary)' }}>{cart.lastPage || 'السلة'}</strong></span>
                        <span>توقيت النشاط: {formatDate(cart.updatedAt)}</span>
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#10B981',
                          color: '#000',
                          padding: '0.6rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>تواصل واتساب مع العميل</span>
                      </a>
                    )}
                  </div>

                  {/* Cart Items Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.6rem 0.5rem' }}>المنتج</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>المقاس</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>الكمية</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>سعر القطعة</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cart.items || []).map((item, itemIdx) => (
                          <tr key={itemIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.nameAr || ''}
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.nameAr || 'منتج KEMET'}</div>
                                {item.nameEn && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.nameEn}</div>}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span style={{ fontWeight: 800, background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                {item.size || 'M'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800 }}>
                              {item.quantity || 1}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                              {item.price} ج.م
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                              {(Number(item.price || 0) * Number(item.quantity || 1))} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cart Card Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      إجمالي القطع في السلة: <strong style={{ color: 'var(--text-primary)' }}>{cart.itemsCount || cart.items?.length || 0} قطعة</strong>
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                      إجمالي قيمة السلة: {cart.totalAmount} ج.م
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* SECTION 2: REGISTERED LEADS & DROP-OFF STAGE */
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          {/* Sub-filter Controls */}
          <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0, marginBottom: '0.25rem' }}>
                سجل العملاء المسجلين الذين لم يتمموا أول طلب
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                {leadFilter === 'active_only' ? 'عرض العملاء الذين بدأوا خطوات شراء أو تفاعلوا مع السلة والعنوان' : 'عرض كافة الحسابات الـ 25 المسجلة في المتجر بدون طلبات'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setLeadFilter('active_only')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: leadFilter === 'active_only' ? 'var(--gold-primary)' : 'transparent',
                  color: leadFilter === 'active_only' ? '#000' : 'var(--text-secondary)'
                }}
              >
                تفاعلوا مع الشراء / السلة
              </button>
              <button
                onClick={() => setLeadFilter('all')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: leadFilter === 'all' ? 'var(--gold-primary)' : 'transparent',
                  color: leadFilter === 'all' ? '#000' : 'var(--text-secondary)'
                }}
              >
                كافة الحسابات المسجلة ({registeredLeads.length})
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>العميل</th>
                  <th style={{ padding: '0.85rem 1rem' }}>رقم الهاتف</th>
                  <th style={{ padding: '0.85rem 1rem' }}>المحافظة والعنوان</th>
                  <th style={{ padding: '0.85rem 1rem' }}>تاريخ التسجيل</th>
                  <th style={{ padding: '0.85rem 1rem' }}>مرحلة التوقف</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {leadFilter === 'active_only' ? 'لا يوجد عملاء في هذا التصنيف حالياً. يمكنك الضغط على "كافة الحسابات المسجلة" لعرض جميع الـ 25 حساب.' : 'لا توجد نتائج تطابق البحث'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, idx) => {
                    const waUrl = getWhatsAppLeadUrl(lead);
                    return (
                      <tr
                        key={lead.id || idx}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: lead.cart ? 'rgba(212, 175, 55, 0.03)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {lead.fullName || 'عميل مسجل'}
                          </div>
                          {lead.email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'right' }}>
                              {lead.email}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: lead.phone ? '#10B981' : 'var(--text-secondary)', direction: 'ltr', display: 'inline-block' }}>
                            {lead.phone || 'غير مسجل'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead.governorate || 'القاهرة'}</div>
                          {lead.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.address}</div>}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                          {formatDate(lead.createdAt)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: lead.cart ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.08)',
                            color: lead.cart ? '#F59E0B' : 'var(--text-primary)',
                            border: lead.cart ? '1px solid #F59E0B' : '1px solid var(--border-color)'
                          }}>
                            {lead.stage}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#10B981',
                                color: '#000',
                                padding: '0.35rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}
                            >
                              واتساب ترويجي
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
