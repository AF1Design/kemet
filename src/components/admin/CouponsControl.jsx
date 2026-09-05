'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  getCouponsAction, 
  addOrUpdateCouponAction, 
  deleteCouponAction, 
  toggleCouponStatusAction,
  getCouponAnalyticsAction
} from '../../app/admin/actions';
import { DEFAULT_COUPONS } from '../../lib/coupons';

export function CouponsControl() {
  const [coupons, setCoupons] = useState(DEFAULT_COUPONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('fixed_price');
  const [targetPrice, setTargetPrice] = useState(220);
  const [percentageValue, setPercentageValue] = useState(10);
  const [fixedAmountValue, setFixedAmountValue] = useState(50);
  const [description, setDescription] = useState('');
  const [totalMaxUses, setTotalMaxUses] = useState(1000);

  // Analytics & Partner Commission State
  const [selectedAnalyticsCode, setSelectedAnalyticsCode] = useState('KEMETFAMILY');
  const [analyticsSearchInput, setAnalyticsSearchInput] = useState('KEMETFAMILY');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [commissionPerPiece, setCommissionPerPiece] = useState(50);

  // Fetch Coupons on Mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getCouponsAction();
        if (res.success && res.coupons) {
          setCoupons(res.coupons);
        }
      } catch (err) {
        console.warn('Coupons load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch Analytics for Selected Code
  const handleFetchAnalytics = async (targetCode) => {
    const clean = String(targetCode || '').trim().toUpperCase();
    if (!clean) return;
    setIsFetchingAnalytics(true);
    setSelectedAnalyticsCode(clean);
    try {
      const res = await getCouponAnalyticsAction(clean);
      if (res.success) {
        setAnalyticsData(res);
      } else {
        setAnalyticsData({
          success: true,
          coupon: { code: clean, type: 'fixed_price' },
          stats: { totalOrdersCount: 0, totalItemsSold: 0, totalSalesRevenue: 0, totalDiscountGiven: 0 },
          orders: []
        });
      }
    } catch (err) {
      console.warn('Fetch analytics error:', err);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

  // Automatically fetch analytics on mount for initial code
  useEffect(() => {
    handleFetchAnalytics('KEMETFAMILY');
  }, []);

  const openAddModal = () => {
    setCode('');
    setType('fixed_price');
    setTargetPrice(220);
    setPercentageValue(10);
    setFixedAmountValue(50);
    setDescription('سعر خاص للتيشيرت 220 ج.م بدلاً من 450 ج.م');
    setTotalMaxUses(1000);
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    startTransition(async () => {
      setStatusMsg(null);
      const val = type === 'fixed_price' 
        ? Number(targetPrice) 
        : (type === 'percentage' ? Number(percentageValue) : Number(fixedAmountValue));

      const payload = {
        code: code.trim().toUpperCase(),
        type: type,
        targetPrice: type === 'fixed_price' ? Number(targetPrice) : null,
        value: val,
        description: description.trim(),
        totalMaxUses: Number(totalMaxUses) || 1000,
        remainingUses: Number(totalMaxUses) || 1000,
        isActive: true,
        usedBy: []
      };

      const res = await addOrUpdateCouponAction(payload);
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
        setIsModalOpen(false);
        handleFetchAnalytics(payload.code);
      } else {
        setStatusMsg(res.error || 'فشل حفظ كود الخصم');
      }
    });
  };

  const handleToggleStatus = (couponCode) => {
    startTransition(async () => {
      const res = await toggleCouponStatusAction(couponCode);
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      }
    });
  };

  const handleDeleteCoupon = (couponCode) => {
    if (!window.confirm(`هل أنت متأكد من حذف كود الخصم (${couponCode}) نهائياً؟`)) return;

    startTransition(async () => {
      const res = await deleteCouponAction(couponCode);
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      }
    });
  };

  const getDiscountLabel = (coupon) => {
    if (coupon.type === 'fixed_price') {
      return `سعر التيشيرت: ${coupon.targetPrice || coupon.value || 220} ج.م`;
    }
    if (coupon.type === 'percentage') {
      return `خصم ${coupon.value}%`;
    }
    return `خصم ${coupon.value} ج.م`;
  };

  const stats = analyticsData?.stats || {
    totalOrdersCount: 0,
    totalItemsSold: 0,
    totalSalesRevenue: 0,
    totalDiscountGiven: 0
  };

  const ordersList = analyticsData?.orders || [];
  const totalCommissionDue = (stats.totalItemsSold || 0) * (Number(commissionPerPiece) || 0);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
            إدارة أكواد الخصم والبروموكود (Promo Codes)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.35rem 0 0 0' }}>
            تحكم في أكواد الخصم، حدد سعر التيشيرت المخصص لكل كود، ويتم إضافة سعر الشحن تلقائياً دون خصم.
          </p>
        </div>

        <button 
          type="button" 
          onClick={openAddModal} 
          className="btn-primary" 
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', fontWeight: 800 }}
        >
          إضافة كود خصم جديد +
        </button>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          جاري تحميل بيانات الأكواد...
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
          لا توجد أكواد خصم مسجلة حالياً. اضغط على زر إضافة كود لإنشاء أول كود.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(212, 175, 55, 0.08)', borderBottom: '1px solid var(--border-gold)' }}>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>كود الخصم</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>نوع الخصم والسعر</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>الوصف / الملاحظات</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>الاستخدامات المتبقية</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>الحالة</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--gold-primary)', fontWeight: 800, textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const usedCount = Array.isArray(c.usedBy) ? c.usedBy.length : 0;
                const remaining = c.remainingUses ?? (c.totalMaxUses - usedCount);

                return (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)', direction: 'ltr', textAlign: 'right', letterSpacing: '1px' }}>
                      {c.code}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#FFF' }}>
                      {getDiscountLabel(c)}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {c.description || '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 800, color: remaining > 0 ? '#10B981' : '#F43F5E' }}>
                        {remaining}
                      </span> / {c.totalMaxUses || 1000}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '0.25rem 0.65rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.78rem', 
                        fontWeight: 800,
                        background: c.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: c.isActive ? '#10B981' : '#F43F5E'
                      }}>
                        {c.isActive ? 'مفعّل ونشط' : 'متوقف'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyticsSearchInput(c.code);
                            handleFetchAnalytics(c.code);
                            const el = document.getElementById('coupon-analytics-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}
                        >
                          تقرير المبيعات
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c.code)}
                          disabled={isPending}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          {c.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.code)}
                          disabled={isPending}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(244, 63, 94, 0.12)',
                            color: '#F43F5E',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            cursor: 'pointer'
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Promo Code Orders & Partner Commission Analytics Section */}
      <div id="coupon-analytics-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-gold)', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
              تقرير وتحليلات مبيعات الأكواد والشراكات
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
              ابحث برمز أي كود لمعرفة عدد الطلبات، والتوقيت، وإجمالي عدد التيشيرتات المباعة لحساب عمولة الشركاء بدقة.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="اكتب كود الخصم (مثال: KEMETFAMILY)..."
              value={analyticsSearchInput}
              onChange={e => setAnalyticsSearchInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleFetchAnalytics(analyticsSearchInput); }}
              style={{ padding: '0.65rem 1rem', fontSize: '0.9rem', direction: 'ltr', textAlign: 'left', minWidth: '220px', textTransform: 'uppercase' }}
            />
            <button
              type="button"
              onClick={() => handleFetchAnalytics(analyticsSearchInput)}
              className="btn-primary"
              disabled={isFetchingAnalytics}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 800 }}
            >
              {isFetchingAnalytics ? 'جاري الفحص...' : 'فحص مبيعات الكود'}
            </button>
          </div>
        </div>

        {/* Selected Code Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>الكود المحدد حالياً:</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold-primary)', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--border-gold)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', letterSpacing: '1px' }}>
            {selectedAnalyticsCode}
          </span>
        </div>

        {/* Metrics Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '0.5rem' }}>
              إجمالي عدد الطلبات
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFF' }}>
              {stats.totalOrdersCount}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>طلب مسجل بهذا الكود</span>
          </div>

          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-glow)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: 900, marginBottom: '0.5rem' }}>
              إجمالي عدد التيشيرتات المباعة
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              {stats.totalItemsSold}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>قطعة تم شراؤها لحساب النسبة</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '0.5rem' }}>
              إجمالي المبيعات المحققة
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>
              {stats.totalSalesRevenue.toLocaleString()} ج.م
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>قيمة المبيعات الإجمالية</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '0.5rem' }}>
              إجمالي الخصومات الممنوحة
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F43F5E' }}>
              {stats.totalDiscountGiven.toLocaleString()} ج.م
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>وفرها العملاء عبر الكود</span>
          </div>

        </div>

        {/* Partner Commission Calculator */}
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
              نسبة أو عمولة الشريك لكل تيشيرت (ج.م):
            </label>
            <input
              type="number"
              min="0"
              value={commissionPerPiece}
              onChange={e => setCommissionPerPiece(Number(e.target.value) || 0)}
              style={{ width: '110px', padding: '0.5rem 0.75rem', fontSize: '1rem', fontWeight: 900, textAlign: 'center' }}
            />
          </div>

          <div style={{ fontSize: '1rem', color: '#FFF' }}>
            <span>إجمالي مستحقات الشريك: </span>
            <strong style={{ color: '#10B981', fontSize: '1.35rem', fontWeight: 900 }}>
              {totalCommissionDue.toLocaleString()} ج.م
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.6rem' }}>
              ({stats.totalItemsSold} تيشيرت × {commissionPerPiece} ج.م)
            </span>
          </div>
        </div>

        {/* Orders Log Table for this Code */}
        <div>
          <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
            سجل وقائمة الطلبات الناتجة عن كود ({selectedAnalyticsCode}) وتوقيتها:
          </h5>

          {isFetchingAnalytics ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              جاري فحص وتحديث قائمة الطلبات...
            </div>
          ) : ordersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
              لم يتم تسجيل أي طلبات شراء باستخدام كود ({selectedAnalyticsCode}) حتى الآن. بمجرد تنفيذ أي عميل لطلب بهذا الكود، سيظهر هنا فورياً مع توقيت الطلب وتفاصيل عدد التيشيرتات.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>رقم الطلب</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>التاريخ والوقت</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>العميل والهاتف</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>المحافظة</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>تفاصيل المنتجات والمقاسات</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', textAlign: 'center' }}>عدد القطع</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>الإجمالي</th>
                    <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((ord, idx) => {
                    const itemsDesc = Array.isArray(ord.items) && ord.items.length > 0
                      ? ord.items.map(i => `${i.quantity}× ${i.name} (${i.size})`).join(' + ')
                      : 'تيشيرت KEMET';

                    return (
                      <tr key={ord.orderId || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          #{ord.orderId}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          <div>{ord.date}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{ord.time}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 800, color: '#FFF' }}>{ord.customerName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'right' }}>{ord.customerPhone}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                          {ord.governorate || 'القاهرة'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', maxWidth: '240px', fontSize: '0.82rem', fontWeight: 700 }}>
                          {itemsDesc}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1rem', background: 'rgba(212,175,55,0.15)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                            {ord.itemsCount || 1}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#10B981' }}>
                          {ord.totalAmount} ج.م
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                            {ord.status || 'جديد'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.2rem',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                إضافة كود بروموكود جديد
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {statusMsg && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#F43F5E', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 700 }}>
                {statusMsg}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  كود الخصم (بالحروف الإنجليزية):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: KEMETFAMILY"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', direction: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  نوع الخصم ونظام التسعير:
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', background: 'var(--bg-dark)', color: '#FFF', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="fixed_price">سعر محدد للتيشيرت (مثال: 220 ج.م للقطعة بدل 450)</option>
                  <option value="percentage">نسبة مئوية من السعر (مثال: 10% أو 15%)</option>
                  <option value="fixed">مبلغ خصم ثابت (مثال: 50 ج.م من الإجمالي)</option>
                </select>
              </div>

              {type === 'fixed_price' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    سعر التيشيرت المطلوب عند استخدام الكود (ج.م):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="220"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.35rem' }}>
                    أي عميل يدخل هذا الكود، سيتم حساب التيشيرت بسعر {targetPrice} ج.م بدلاً من السعر الأصلي + مصاريف الشحن للمحافظة.
                  </small>
                </div>
              )}

              {type === 'percentage' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    نسبة الخصم (%):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    placeholder="10"
                    value={percentageValue}
                    onChange={e => setPercentageValue(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  />
                </div>
              )}

              {type === 'fixed' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    مبلغ الخصم الثابت (ج.م):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={fixedAmountValue}
                    onChange={e => setFixedAmountValue(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  وصف الكود / ملاحظة (تظهر للمسؤول والعميل):
                </label>
                <input
                  type="text"
                  placeholder="مثال: خصم عائلة KEMET - سعر التيشيرت 220 ج.م"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  الحد الأقصى لعدد الاستخدامات:
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={totalMaxUses}
                  onChange={e => setTotalMaxUses(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.75rem 1.4rem' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontWeight: 900 }}
                >
                  {isPending ? 'جاري الحفظ...' : 'حفظ وتفعيل الكود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
