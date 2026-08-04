'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { sendMassPromoEmailAction, getRegisteredUsersStatsAction } from '../actions';
import { translations } from '../../../data/translations';

const INITIAL_COUPONS = [
  { code: 'KEMET10', type: 'percentage', value: 10, isActive: true, totalMaxUses: 1000, remainingUses: 1000, maxUsesPerUser: 1, usedBy: [] },
  { code: 'OFF50', type: 'fixed', value: 50, isActive: true, totalMaxUses: 500, remainingUses: 500, maxUsesPerUser: 1, usedBy: [] },
  { code: 'LEGACY2027', type: 'percentage', value: 15, isActive: true, totalMaxUses: 100, remainingUses: 100, maxUsesPerUser: 1, usedBy: [] }
];

export default function AdminContentCMSPage() {
  const { cmsSettings, updateCmsSettings } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);
  const [emailCampaignSending, setEmailCampaignSending] = useState(false);
  const [emailCampaignSentMsg, setEmailCampaignSentMsg] = useState('');
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [lastDeliveryStats, setLastDeliveryStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getRegisteredUsersStatsAction();
        if (res.success) {
          setRegisteredUsersCount(res.count);
        }
      } catch (e) {
        console.warn('Users count load warning:', e);
      }
    }
    loadStats();
  }, []);

  const [settings, setSettings] = useState({
    isPromoActive: cmsSettings?.isPromoActive ?? true,
    promoTextAr: cmsSettings?.promoTextAr || '🔥 خصومات KEMET 2027 لفترة محدودة - شحن سريع لكافة المحافظات مجاناً مع الأطقم الرسمية',
    promoTextEn: cmsSettings?.promoTextEn || '🔥 Limited Time Offer - Fast Shipping Across All Egypt Governorates!',
    isFreeShippingPromo: cmsSettings?.isFreeShippingPromo ?? false,
    whatsappPhone: cmsSettings?.whatsappPhone || '01114687759',
    instagramLink: cmsSettings?.instagramLink || 'https://instagram.com/kemet',
    facebookLink: cmsSettings?.facebookLink || 'https://facebook.com/kemet',
    tiktokLink: cmsSettings?.tiktokLink || 'https://www.tiktok.com/@kemet.ya?_r=1&_t=ZS-98bdUO43owB',
    heroTitleAr: cmsSettings?.heroTitleAr || translations.ar.heroTitle,
    heroSubtitleAr: cmsSettings?.heroSubtitleAr || translations.ar.heroSubtitle,
    heroTitleEn: cmsSettings?.heroTitleEn || translations.en.heroTitle,
    heroSubtitleEn: cmsSettings?.heroSubtitleEn || translations.en.heroSubtitle,
    returnPolicyDescAr: cmsSettings?.returnPolicyDescAr || translations.ar.returnPolicySubtitle,
    returnPolicyDescEn: cmsSettings?.returnPolicyDescEn || translations.en.returnPolicySubtitle,
  });

  // Shipping Rates State
  const [shippingRates, setShippingRates] = useState(cmsSettings?.shippingRates || {
    'القاهرة': 40,
    'الجيزة': 40,
    'الإسكندرية': 50,
    'القليوبية': 45,
    'الشرقية': 50,
    'الدقهلية': 50,
    'الغربية': 50,
    'المنوفية': 50,
    'البحيرة': 55,
    'كفر الشيخ': 55,
    'دمياط': 55,
    'الإسماعيلية': 55,
    'السويس': 55,
    'بورسعيد': 55,
    'بني سويف': 60,
    'المنيا': 60,
    'أسيوط': 65,
    'سوهاج': 65,
    'قنا': 70,
    'الأقصر': 70,
    'أسوان': 75,
    'محافظة أخرى': 60
  });

  // Sync form state when cmsSettings loads from localStorage
  useEffect(() => {
    if (cmsSettings) {
      setSettings({
        isPromoActive: cmsSettings.isPromoActive ?? true,
        promoTextAr: cmsSettings.promoTextAr || '',
        promoTextEn: cmsSettings.promoTextEn || '',
        isFreeShippingPromo: cmsSettings.isFreeShippingPromo ?? false,
        whatsappPhone: cmsSettings.whatsappPhone || '01114687759',
        instagramLink: cmsSettings.instagramLink || '',
        facebookLink: cmsSettings.facebookLink || '',
        tiktokLink: cmsSettings.tiktokLink || '',
        heroTitleAr: cmsSettings.heroTitleAr || '',
        heroSubtitleAr: cmsSettings.heroSubtitleAr || '',
        heroTitleEn: cmsSettings.heroTitleEn || '',
        heroSubtitleEn: cmsSettings.heroSubtitleEn || '',
        returnPolicyDescAr: cmsSettings.returnPolicyDescAr || '',
        returnPolicyDescEn: cmsSettings.returnPolicyDescEn || ''
      });
      if (cmsSettings.shippingRates) {
        setShippingRates(cmsSettings.shippingRates);
      }
    }
  }, [cmsSettings]);

  const [massRateInput, setMassRateInput] = useState('');
  const [newGovName, setNewGovName] = useState('');
  const [newGovFee, setNewGovFee] = useState(50);

  // Coupons state
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    totalMaxUses: 1000,
    maxUsesPerUser: 1
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kemet_coupons');
      if (saved) {
        setCoupons(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Coupon load note:', e);
    }
  }, []);

  const saveCouponsToStorage = (updated) => {
    setCoupons(updated);
    try {
      localStorage.setItem('kemet_coupons', JSON.stringify(updated));
    } catch (e) {
      console.warn('Coupon save note:', e);
    }
  };

  const handleToggleCoupon = (code) => {
    const updated = coupons.map(c => c.code.toUpperCase() === code.toUpperCase() ? { ...c, isActive: !c.isActive } : c);
    saveCouponsToStorage(updated);
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    const codeUpper = newCoupon.code.trim().toUpperCase();
    if (coupons.some(c => c.code.toUpperCase() === codeUpper)) {
      alert('⚠️ كود الخصم هذا مضاف بالفعل بنفس الاسم');
      return;
    }

    const maxUses = Number(newCoupon.totalMaxUses || 1000);

    const updated = [
      ...coupons,
      {
        code: codeUpper,
        type: newCoupon.type,
        value: Number(newCoupon.value),
        isActive: true,
        totalMaxUses: maxUses,
        remainingUses: maxUses,
        maxUsesPerUser: 1,
        usedBy: []
      }
    ];

    saveCouponsToStorage(updated);
    setNewCoupon({ code: '', type: 'percentage', value: 10, totalMaxUses: 1000, maxUsesPerUser: 1 });
    alert(`✅ تم إضافة كود الخصم (${codeUpper}) بإجمالي (${maxUses}) استخدام بنجاح!`);
  };

  // Shipping Rate Actions
  const handleMassUpdateRates = () => {
    if (massRateInput === '' || isNaN(Number(massRateInput))) {
      alert('⚠️ يرجى إدخال قيمة رقمية صحيحة لرسوم الشحن');
      return;
    }
    const val = Number(massRateInput);
    const updated = {};
    Object.keys(shippingRates).forEach(g => {
      updated[g] = val;
    });
    setShippingRates(updated);
    alert(`✅ تم تحديث رسوم الشحن لجميع المحافظات دفعة واحدة إلى (${val} ج.م) بنجاح!`);
  };

  const handleSingleRateChange = (gov, fee) => {
    setShippingRates(prev => ({
      ...prev,
      [gov]: Number(fee)
    }));
  };

  const handleDeleteGov = (gov) => {
    if (Object.keys(shippingRates).length <= 1) {
      alert('⚠️ لا يمكن حذف المحافظة الأخيرة');
      return;
    }
    const copy = { ...shippingRates };
    delete copy[gov];
    setShippingRates(copy);
  };

  const handleAddGov = (e) => {
    e.preventDefault();
    if (!newGovName.trim()) return;
    setShippingRates(prev => ({
      ...prev,
      [newGovName.trim()]: Number(newGovFee)
    }));
    setNewGovName('');
    setNewGovFee(50);
  };

  const handleSendMassEmailCampaign = async () => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في إرسال هذا العرض الترويجي كـ إيميل رسمي لجميع العملاء المسجلين (${registeredUsersCount} عميل)؟`)) {
      return;
    }

    setEmailCampaignSending(true);
    setEmailCampaignSentMsg('');
    setLastDeliveryStats(null);

    try {
      const res = await sendMassPromoEmailAction(settings.promoTextAr);
      if (res.success) {
        setLastDeliveryStats({
          sentCount: res.sentCount,
          failedCount: res.failedCount,
          total: res.totalRecipients
        });
        setEmailCampaignSentMsg(`🚀 تم إرسال البريد! (وصل لـ ${res.sentCount} عميل | لم يصل لـ ${res.failedCount} عميل من أصل ${res.totalRecipients})`);
        
        // Refresh registered count from Supabase
        const stats = await getRegisteredUsersStatsAction();
        if (stats.success) setRegisteredUsersCount(stats.count);
      } else {
        alert('⚠️ فشل إرسال البريد الترويجي: ' + (res.error || 'خطأ بالسيرفر'));
      }
    } catch (err) {
      alert('⚠️ خطأ في الإرسال: ' + err.message);
    } finally {
      setEmailCampaignSending(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateCmsSettings({
      ...settings,
      shippingRates
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>⚙️ لوحة إدارة المحتوى، البانر، الكوبونات، والشحن</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          التحكم المباشر بالإعلانات العليا، الكوبونات والخصومات، رسوم الشحن لكل المحافظات، وعناوين الموقع.
        </p>
      </div>

      {isSaved && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          color: '#10B981',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          fontWeight: 800
        }}>
          ✅ تم حفظ وتحديث كافة الإعدادات والبانر ورسوم الشحن والكوبونات في النظام بنجاح!
        </div>
      )}

      {emailCampaignSentMsg && (
        <div style={{
          background: 'rgba(37, 211, 102, 0.15)',
          border: '1px solid #25D366',
          color: '#25D366',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          fontWeight: 800
        }}>
          {emailCampaignSentMsg}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          📢 البانر الترويجي والبريد
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={activeTab === 'shipping' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🚚 رسوم الشحن بالمحافظات
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={activeTab === 'coupons' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🎟️ إدارة كوبونات الخصم
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={activeTab === 'hero' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🏆 الواجهة الرئيسية
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-glow)' }}>

        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              📢 إعدادات البانر الترويجي ورسائل العروض
            </h3>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(212,175,55,0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)' }}>
              <input 
                type="checkbox"
                checked={settings.isPromoActive}
                onChange={e => setSettings({ ...settings, isPromoActive: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--gold-primary)' }}
              />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                تفعيل إظهار البانر الترويجي أعلى الهيدر في الموقع
              </span>
            </label>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                نص العرض الترويجي بالعربية:
              </label>
              <textarea
                rows={3}
                value={settings.promoTextAr}
                onChange={e => setSettings({ ...settings, promoTextAr: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                نص العرض بالإنجليزية:
              </label>
              <textarea
                rows={2}
                value={settings.promoTextEn}
                onChange={e => setSettings({ ...settings, promoTextEn: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            {/* Mass Email Trigger Button & Real Live Users Counter */}
            <div style={{ background: 'rgba(37, 211, 102, 0.08)', border: '1px solid #25D366', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
                <div style={{ fontWeight: 900, color: '#25D366', fontSize: '1rem' }}>
                  📧 إرسال حملة البريد الترويجي للعملاء
                </div>

                {/* Real-time Registered Users Counter Badge from Supabase Auth */}
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-gold)', color: 'var(--gold-primary)', padding: '0.45rem 0.95rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👥 إجمالي العملاء المسجلين بالداتا بيس:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#FFF' }}>{registeredUsersCount} عميل</strong>
                  <span style={{ fontSize: '0.75rem', color: '#10B981' }} title="محدث حي ومباشر من Supabase Database">(حقيقي مفعّل ⚡)</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                انقر على الزر أدناه لإرسال رسالة هذا العرض كـ إيميل رسمي لجميع العملاء المسجلين بالموقع ({registeredUsersCount} عميل). في حال حذف أي حساب من داتا بيس Supabase يتحدث هذا الرقم تلقائياً.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={handleSendMassEmailCampaign}
                  disabled={emailCampaignSending}
                  style={{ background: '#25D366', color: '#FFF', border: 'none', padding: '0.8rem 1.6rem', borderRadius: 'var(--radius-md)', fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  {emailCampaignSending ? 'جاري الإرسال والمتابعة...' : '🚀 إرسال هذا العرض الترويجي لكل العملاء المسجلين'}
                </button>

                {/* Detailed delivery status notification */}
                {emailCampaignSentMsg && (
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>
                    {emailCampaignSentMsg}
                  </div>
                )}
              </div>

              {/* Delivery analytics badge */}
              {lastDeliveryStats && (
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontWeight: 800, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#10B981' }}>✅ الإيميلات التي وصلت بنجاح: <strong>{lastDeliveryStats.sentCount}</strong> عميل</span>
                  <span style={{ color: '#F43F5E' }}>⚠️ الإيميلات التي لم تصل / تعذر إرسالها: <strong>{lastDeliveryStats.failedCount}</strong> عميل</span>
                  <span style={{ color: 'var(--gold-primary)' }}>📊 إجمالي المستهدفين: <strong>{lastDeliveryStats.total}</strong> عميل</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Shipping Rates Tab */}
        {activeTab === 'shipping' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
              🚚 إدارة وتحكم رسوم الشحن لكافة المحافظات
            </h3>

            {/* Free Shipping Toggle Rule */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #10B981' }}>
              <input 
                type="checkbox"
                checked={settings.isFreeShippingPromo}
                onChange={e => setSettings({ ...settings, isFreeShippingPromo: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10B981' }}
              />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10B981' }}>
                🎉 تفعيل عرض الشحن المجاني (0 ج.م) لجميع المحافظات تلقائياً في صفحة الشيك أوت!
              </span>
            </label>

            {/* Mass Update All Rates */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-gold)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                ⚡ تعديل رسوم الشحن لكل المحافظات دفعة واحدة (أوبشن السعر الموحد):
              </h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="number" 
                  placeholder="أدخل رسوم الشحن (مثال: 0 أو 50)"
                  value={massRateInput}
                  onChange={e => setMassRateInput(e.target.value)}
                  style={{ width: '240px', padding: '0.65rem 0.85rem' }}
                />
                <button type="button" onClick={handleMassUpdateRates} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                  تطبيق السعر على كل المحافظات ⚡
                </button>
              </div>
            </div>

            {/* Add New Governorate Form */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                ➕ إضافة محافظة جديدة:
              </h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="اسم المحافظة (مثال: الوادي الجديد)"
                  value={newGovName}
                  onChange={e => setNewGovName(e.target.value)}
                  style={{ flexGrow: 1, padding: '0.6rem 0.85rem' }}
                />
                <input 
                  type="number" 
                  placeholder="رسوم الشحن (ج.م)"
                  value={newGovFee}
                  onChange={e => setNewGovFee(e.target.value)}
                  style={{ width: '130px', padding: '0.6rem 0.85rem' }}
                />
                <button type="button" onClick={handleAddGov} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                  إضافة المحافظة
                </button>
              </div>
            </div>

            {/* Governorates Table */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                📋 قائمة المحافظات ورسوم شحن كل منها:
              </h4>

              <table border="0" cellPadding="0" cellSpacing="0" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>المحافظة</th>
                    <th style={{ padding: '10px' }}>رسوم الشحن (ج.م)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(shippingRates).map((gov) => (
                    <tr key={gov} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '10px', fontWeight: 800, color: '#FFF' }}>{gov}</td>
                      <td style={{ padding: '10px' }}>
                        <input 
                          type="number"
                          value={shippingRates[gov]}
                          onChange={e => handleSingleRateChange(gov, e.target.value)}
                          style={{ width: '110px', padding: '0.4rem 0.6rem', fontWeight: 900, color: 'var(--gold-primary)' }}
                        /> ج.م
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteGov(gov)}
                          style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid #F43F5E', color: '#F43F5E', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          حذف المحافظة 🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
              🎟️ لوحة إضافة وإدارة كوبونات الخصم
            </h3>

            {/* Add Coupon Form */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                ➕ إضافة كوبون خصم جديد:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>كود الخصم (رمز الكوبون):</label>
                  <input 
                    type="text"
                    placeholder="مثال: KEMET20"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>نوع الخصم:</label>
                  <select 
                    value={newCoupon.type} 
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>قيمة الخصم:</label>
                  <input 
                    type="number"
                    min="1"
                    value={newCoupon.value}
                    onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>أقصى عدد استخدامات (لجميع العملاء):</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="مثال: 1000"
                    value={newCoupon.totalMaxUses}
                    onChange={e => setNewCoupon({ ...newCoupon, totalMaxUses: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  />
                </div>

                <div>
                  <button type="button" onClick={handleAddCoupon} className="btn-primary" style={{ width: '100%', padding: '0.7rem' }}>
                    إضافة الكوبون ✨
                  </button>
                </div>
              </div>
            </div>

            {/* Coupons Table */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                📋 الكوبونات الحالية المسجلة بالنظام:
              </h4>

              <table border="0" cellPadding="0" cellSpacing="0" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px' }}>كود الكوبون</th>
                    <th style={{ padding: '10px' }}>نوع الخصم</th>
                    <th style={{ padding: '10px' }}>القيمة</th>
                    <th style={{ padding: '10px' }}>عدد الاستخدامات المتبقية</th>
                    <th style={{ padding: '10px' }}>الحالة الحالية</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>التحكم بالصلاحية</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c, idx) => {
                    const totalMax = c.totalMaxUses ?? 1000;
                    const usedCount = (c.usedBy || []).length;
                    const remaining = c.remainingUses ?? Math.max(0, totalMax - usedCount);
                    const isExpiredByUses = remaining <= 0 || usedCount >= totalMax;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '10px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{c.code}</td>
                        <td style={{ padding: '10px' }}>{c.type === 'percentage' ? 'نسبة مئوية (%)' : 'مبلغ ثابت (ج.م)'}</td>
                        <td style={{ padding: '10px', fontWeight: 800 }}>{c.value} {c.type === 'percentage' ? '%' : 'ج.م'}</td>
                        <td style={{ padding: '10px', fontWeight: 800 }}>
                          <span style={{ color: isExpiredByUses ? '#F43F5E' : '#10B981' }}>
                            {remaining} متبقي من {totalMax} (استخدمه {usedCount} عميل)
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: (c.isActive && !isExpiredByUses) ? '#10B981' : '#F43F5E', fontWeight: 800 }}>
                            {isExpiredByUses 
                              ? 'انتهت الصلاحية (وصل للحد الأقصى) 🚫' 
                              : (c.isActive ? 'نشط ومسجل ✅' : 'معطل يدويًا 🚫')
                            }
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleToggleCoupon(c.code)}
                            style={{
                              background: c.isActive ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                              border: c.isActive ? '1px solid #F43F5E' : '1px solid #10B981',
                              color: c.isActive ? '#F43F5E' : '#10B981',
                              padding: '0.4rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            {c.isActive ? 'إنهاء الصلاحية 🚫' : 'تفعيل الكوبون ✅'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              🏆 نصوص الصفحة الرئيسية (Hero Banner Texts)
            </h3>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                العنوان الرئيسي بالعربية:
              </label>
              <input
                type="text"
                value={settings.heroTitleAr}
                onChange={e => setSettings({ ...settings, heroTitleAr: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'end' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}>
            حفظ كافة التغييرات في النظام 💾
          </button>
        </div>

      </form>
    </div>
  );
}
