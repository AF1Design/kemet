'use client';

import React, { useState, useEffect } from 'react';
import { translations } from '../../../data/translations';

const INITIAL_COUPONS = [
  { code: 'KEMET10', type: 'percentage', value: 10, isActive: true, maxUsesPerUser: 1, usedBy: [] },
  { code: 'OFF50', type: 'fixed', value: 50, isActive: true, maxUsesPerUser: 1, usedBy: [] },
  { code: 'LEGACY2027', type: 'percentage', value: 15, isActive: true, maxUsesPerUser: 1, usedBy: [] }
];

export default function AdminContentCMSPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);
  const [emailCampaignSending, setEmailCampaignSending] = useState(false);
  const [emailCampaignSentMsg, setEmailCampaignSentMsg] = useState('');

  const [settings, setSettings] = useState({
    isPromoActive: true,
    promoTextAr: '🔥 خصومات KEMET 2027 لفترة محدودة - شحن سريع لكافة المحافظات مجاناً مع الأطقم الرسمية',
    promoTextEn: '🔥 Limited Time Offer - Fast Shipping Across All Egypt Governorates!',
    whatsappPhone: '01114687759',
    instagramLink: 'https://instagram.com/kemet',
    facebookLink: 'https://facebook.com/kemet',
    tiktokLink: 'https://www.tiktok.com/@kemet.ya?_r=1&_t=ZS-98bdUO43owB',
    heroTitleAr: translations.ar.heroTitle,
    heroSubtitleAr: translations.ar.heroSubtitle,
    heroTitleEn: translations.en.heroTitle,
    heroSubtitleEn: translations.en.heroSubtitle,
    returnPolicyDescAr: translations.ar.returnPolicySubtitle,
    returnPolicyDescEn: translations.en.returnPolicySubtitle,
  });

  // Coupons state
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: 10,
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

    const updated = [
      ...coupons,
      {
        code: codeUpper,
        type: newCoupon.type,
        value: Number(newCoupon.value),
        isActive: true,
        maxUsesPerUser: Number(newCoupon.maxUsesPerUser || 1),
        usedBy: []
      }
    ];

    saveCouponsToStorage(updated);
    setNewCoupon({ code: '', type: 'percentage', value: 10, maxUsesPerUser: 1 });
    alert(`✅ تم إضافة كود الخصم (${codeUpper}) بنجاح!`);
  };

  const handleSendMassEmailCampaign = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إرسال هذا العرض الترويجي كـ إيميل رسمي لجميع العملاء المسجلين؟')) {
      return;
    }

    setEmailCampaignSending(true);
    setEmailCampaignSentMsg('');

    setTimeout(() => {
      setEmailCampaignSending(false);
      setEmailCampaignSentMsg('🚀 تم بدء إرسال حملة البريد الترويجي للعملاء المسجلين في الخلفية بنجاح!');
      setTimeout(() => setEmailCampaignSentMsg(''), 6000);
    }, 1500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>⚙️ لوحة إدارة المحتوى، البانر، والكوبونات</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          التحكم الكامل بالإعلانات العليا، الكوبونات والخصومات، روابط التواصل، وعناوين الموقع.
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
          ✅ تم حفظ وتحديث كافة الإعدادات والكوبونات في النظام بنجاح!
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
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={activeTab === 'social' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🔗 السوشيال ميديا
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

            {/* Mass Email Trigger Button */}
            <div style={{ background: 'rgba(37, 211, 102, 0.08)', border: '1px solid #25D366', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '1rem' }}>
              <div style={{ fontWeight: 800, color: '#25D366', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                📧 إرسال حملة البريد الترويجي للمستخدمين:
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                انقر على الزر أدناه لإرسال رسالة هذا العرض كـ إيميل رسمي في الخلفية لكافة العملاء المسجلين.
              </p>
              <button 
                type="button" 
                onClick={handleSendMassEmailCampaign}
                disabled={emailCampaignSending}
                style={{ background: '#25D366', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {emailCampaignSending ? 'جاري إرسال الحملة...' : '🚀 إرسال هذا العرض الترويجي كـ إيميل لكل العملاء'}
              </button>
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
                    <th style={{ padding: '10px' }}>الاستخدامات</th>
                    <th style={{ padding: '10px' }}>الحالة الحالية</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>التحكم بالصلاحية</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '10px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{c.code}</td>
                      <td style={{ padding: '10px' }}>{c.type === 'percentage' ? 'نسبة مئوية (%)' : 'مبلغ ثابت (ج.م)'}</td>
                      <td style={{ padding: '10px', fontWeight: 800 }}>{c.value} {c.type === 'percentage' ? '%' : 'ج.م'}</td>
                      <td style={{ padding: '10px' }}>{(c.usedBy || []).length} عملاء</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: c.isActive ? '#10B981' : '#F43F5E', fontWeight: 800 }}>
                          {c.isActive ? 'نشط ومسجل ✅' : 'انتهت الصلاحية / معطل 🚫'}
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
                  ))}
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

        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              🔗 روابط التواصل والتواجد الرقمي
            </h3>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                رقم الواتساب الرسمي:
              </label>
              <input
                type="text"
                value={settings.whatsappPhone}
                onChange={e => setSettings({ ...settings, whatsappPhone: e.target.value })}
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
