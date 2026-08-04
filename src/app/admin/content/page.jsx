'use client';

import React, { useState } from 'react';
import { translations } from '../../../data/translations';

export default function AdminContentCMSPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);

  const [settings, setSettings] = useState({
    promoTextAr: translations.ar.promoText,
    promoTextEn: translations.en.promoText,
    whatsappPhone: '01114687759',
    instagramLink: 'https://instagram.com/kemet',
    facebookLink: 'https://facebook.com/kemet',
    tiktokLink: 'https://tiktok.com/@kemet',
    heroTitleAr: translations.ar.heroTitle,
    heroSubtitleAr: translations.ar.heroSubtitle,
    heroTitleEn: translations.en.heroTitle,
    heroSubtitleEn: translations.en.heroSubtitle,
    returnPolicyDescAr: translations.ar.returnPolicySubtitle,
    returnPolicyDescEn: translations.en.returnPolicySubtitle,
  });

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
          <span>⚙️ لوحة إدارة نصوص ومحتوى الموقع (Content CMS)</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          تحكم كامل وتعديل شامل لكافة النصوص، الإعلانات العليا، روابط التواصل، وعناوين الصفحات بدون حاجة للتعديل بالبرمجة.
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
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span>✅ تم حفظ وتحديث كافة الإعدادات والنصوص بنجاح في نظام الموقع!</span>
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
          📢 الشريط الإعلاني ورابط الواتساب
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={activeTab === 'hero' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🏆 الواجهة الرئيسية (Hero Section)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={activeTab === 'social' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🔗 روابط التواصل والسوشيال ميديا
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={activeTab === 'policy' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
        >
          🛡️ سياسة الاسترجاع والضمان
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-glow)' }}>

        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              📢 إعدادات الشريط الترويجي العلوي (Announcement Bar)
            </h3>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                نص العرض الترويجي بالعربية (الشريط العلوي):
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
                نص العرض الترويجي بالإنجليزية (English Announcement):
              </label>
              <textarea
                rows={3}
                value={settings.promoTextEn}
                onChange={e => setSettings({ ...settings, promoTextEn: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
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

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                الوصف الفرعي بالعربية:
              </label>
              <textarea
                rows={2}
                value={settings.heroSubtitleAr}
                onChange={e => setSettings({ ...settings, heroSubtitleAr: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                Main Title (English):
              </label>
              <input
                type="text"
                value={settings.heroTitleEn}
                onChange={e => setSettings({ ...settings, heroTitleEn: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                Subtitle (English):
              </label>
              <textarea
                rows={2}
                value={settings.heroSubtitleEn}
                onChange={e => setSettings({ ...settings, heroSubtitleEn: e.target.value })}
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
                رقم الواتساب الرسمي (خدمة العملاء والإلغاء):
              </label>
              <input
                type="text"
                value={settings.whatsappPhone}
                onChange={e => setSettings({ ...settings, whatsappPhone: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                رابط حساب انستجرام (Instagram):
              </label>
              <input
                type="text"
                value={settings.instagramLink}
                onChange={e => setSettings({ ...settings, instagramLink: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                رابط صفحة فيسبوك (Facebook):
              </label>
              <input
                type="text"
                value={settings.facebookLink}
                onChange={e => setSettings({ ...settings, facebookLink: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                رابط حساب تيك توك (TikTok):
              </label>
              <input
                type="text"
                value={settings.tiktokLink}
                onChange={e => setSettings({ ...settings, tiktokLink: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              🛡️ سياسة الاسترجاع وضمان الجودة
            </h3>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                نص ضمان الاسترجاع بالعربية:
              </label>
              <textarea
                rows={4}
                value={settings.returnPolicyDescAr}
                onChange={e => setSettings({ ...settings, returnPolicyDescAr: e.target.value })}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                Return Policy Description (English):
              </label>
              <textarea
                rows={4}
                value={settings.returnPolicyDescEn}
                onChange={e => setSettings({ ...settings, returnPolicyDescEn: e.target.value })}
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
