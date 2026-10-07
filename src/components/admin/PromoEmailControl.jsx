'use client';

import React, { useState, useEffect } from 'react';
import { 
  getRegisteredUsersStatsAction, 
  sendMassPromoEmailAction, 
  sendTestPromoEmailAction,
  uploadPromoImageAction 
} from '../../app/admin/actions';
import { PROMO_CAMPAIGN_PRESETS } from '../../lib/promo-email-template';

const QUICK_LIBRARY_ITEMS = [
  {
    title: 'تراك الأهلي الأسود الشتوي',
    url: 'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-ahly.jpg'
  },
  {
    title: 'تراك برشلونة الشتوي',
    url: 'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-barca.jpg'
  },
  {
    title: 'تراك فرنسا الشتوي',
    url: 'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-france.jpg'
  },
  {
    title: 'طقم ريال مدريد الأبيض 2027',
    url: 'https://kemetmisr.com/assets/kit-real-madrid-white-2027.jpg'
  },
  {
    title: 'طقم ريال مدريد الكحلي 2027',
    url: 'https://kemetmisr.com/assets/kit-real-madrid-navy-2027.jpg'
  },
  {
    title: 'طقم أتلتيكو مدريد 2027',
    url: 'https://kemetmisr.com/assets/kit-atletico-madrid-2027.jpg'
  },
  {
    title: 'بانر KEMET الهيرو الرياضي',
    url: 'https://kemetmisr.com/assets/kemet-hero-banner.jpg'
  }
];

export function PromoEmailControl({ initialTotalUsers = 129 }) {
  const [totalUsers, setTotalUsers] = useState(initialTotalUsers);
  const [emailsSentCount, setEmailsSentCount] = useState(0);

  // Campaign State initialized with the First High-Converting Preset (Discount Voucher)
  const defaultPreset = PROMO_CAMPAIGN_PRESETS[0];
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPreset.id);
  const [subject, setSubject] = useState(defaultPreset.subject);
  const [headline, setHeadline] = useState(defaultPreset.headline);
  const [badge, setBadge] = useState(defaultPreset.badge);
  const [couponCode, setCouponCode] = useState(defaultPreset.couponCode);
  const [discountNote, setDiscountNote] = useState(defaultPreset.discountNote);
  const [bodyText, setBodyText] = useState(defaultPreset.bodyText);
  const [ctaText, setCtaText] = useState(defaultPreset.ctaText);
  const [ctaUrl, setCtaUrl] = useState(defaultPreset.ctaUrl);
  const [whatsappChannelText, setWhatsappChannelText] = useState(defaultPreset.whatsappChannelText || 'انضم لقناة الواتساب علشان يوصلك كل جديد قبل أي حد');
  const [whatsappChannelUrl, setWhatsappChannelUrl] = useState(defaultPreset.whatsappChannelUrl || 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q');
  const [images, setImages] = useState(defaultPreset.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Studio UI states
  const [activeView, setActiveView] = useState('edit'); // 'edit' | 'preview'
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load real registered users count from Supabase DB on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getRegisteredUsersStatsAction();
        if (res?.success && typeof res.count === 'number') {
          setTotalUsers(res.count);
        }
      } catch (err) {
        console.warn('Error loading user stats:', err);
      }
    }
    loadStats();
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSubject(preset.subject);
    setHeadline(preset.headline);
    setBadge(preset.badge);
    setCouponCode(preset.couponCode);
    setDiscountNote(preset.discountNote);
    setBodyText(preset.bodyText);
    setCtaText(preset.ctaText);
    setCtaUrl(preset.ctaUrl);
    setWhatsappChannelText(preset.whatsappChannelText || '');
    setWhatsappChannelUrl(preset.whatsappChannelUrl || '');
    setImages(preset.images || []);
    setStatusMsg(null);
  };

  // Trigger Send Action after confirmation
  const handleConfirmSend = async () => {
    setIsConfirmModalOpen(false);
    setStatusMsg(null);
    setIsSending(true);

    try {
      const res = await sendMassPromoEmailAction({
        subject: subject.trim(),
        headline: headline.trim(),
        badge: badge.trim(),
        couponCode: couponCode.trim().toUpperCase(),
        discountNote: discountNote.trim(),
        promoTextAr: bodyText.trim(),
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim(),
        whatsappChannelText: whatsappChannelText.trim(),
        whatsappChannelUrl: whatsappChannelUrl.trim(),
        images: images
      });

      if (res?.success) {
        const newlySent = res.sentCount || 0;
        setEmailsSentCount(prev => prev + newlySent);

        setStatusMsg({
          type: 'success',
          text: `تم إرسال العرض الترويجي بنجاح إلى ${newlySent} مستخدم مسجل بالبريد من أصل ${res.totalRecipients || totalUsers}.`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res?.error || 'حدث خطأ في الخادم أثناء إرسال البريد الجماعي.'
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'حدث خطأ في شبكة الإرسال.'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Trigger Test Send directly to admin email only
  const handleSendTest = async () => {
    setIsSendingTest(true);
    setStatusMsg(null);

    try {
      const res = await sendTestPromoEmailAction({
        targetEmail: 'amaarfekry5@gmail.com',
        subject: subject.trim(),
        headline: headline.trim(),
        badge: badge.trim(),
        couponCode: couponCode.trim().toUpperCase(),
        discountNote: discountNote.trim(),
        promoTextAr: bodyText.trim(),
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim(),
        whatsappChannelText: whatsappChannelText.trim(),
        whatsappChannelUrl: whatsappChannelUrl.trim(),
        images: images
      });

      if (res?.success) {
        setStatusMsg({
          type: 'success',
          text: `تم إرسال الإيميل التجريبي بنجاح إلى (${res.recipient || 'amaarfekry5@gmail.com'}). تفقد بريدك الآن لمراجعة مظهر الرسالة.`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res?.error || 'حدث خطأ أثناء إرسال الإيميل التجريبي.'
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'حدث خطأ في شبكة الإرسال.'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle adding an image
  const handleAddImage = (urlToAdd = null) => {
    const targetUrl = typeof urlToAdd === 'string' ? urlToAdd.trim() : newImageUrl.trim();
    if (!targetUrl) return;
    setImages(prev => [...prev, targetUrl]);
    if (!urlToAdd) setNewImageUrl('');
  };

  // Handle removing an image
  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle reordering images
  const handleMoveImage = (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages(prev => {
      const updated = [...prev];
      const temp = updated[currentIndex];
      updated[currentIndex] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Handle file upload from user device
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      try {
        const res = await uploadPromoImageAction(base64Data, file.name);
        if (res?.success && res.url) {
          setImages(prev => [...prev, res.url]);
        } else {
          setImages(prev => [...prev, base64Data]);
        }
      } catch (err) {
        setImages(prev => [...prev, base64Data]);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Format body text for live preview
  const previewParagraphs = (bodyText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\s*\n/)
    .filter(Boolean);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-gold-bright)',
      borderRadius: 'var(--radius-lg)',
      padding: 'clamp(1.2rem, 3vw, 2.2rem)',
      boxShadow: 'var(--shadow-glow)',
      marginBottom: '2.5rem'
    }}>
      {/* Top Header: Title & Recipient Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold-primary)', boxShadow: '0 0 10px var(--gold-primary)' }}></span>
            <h3 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
              استوديو إطلاق الحملات الترويجية بالبريد الإلكتروني
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            نظام تصميم وبث الحملات التسويقية الفاخرة لكافة متسوقي وعملاء متجر KEMET المسجلين
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--gold-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            textAlign: 'center',
            minWidth: '130px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              الجمهور المستهدف المسجل
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              {totalUsers} عميل
            </span>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            textAlign: 'center',
            minWidth: '130px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              تم الإرسال في هذه الجلسة
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
              {emailsSentCount}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Selector Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
          اختر نوع وقالب الحملة الترويجية (قوالب مجهزة واحترافية):
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {PROMO_CAMPAIGN_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(0,0,0,0.3)',
                  border: isSelected ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  textAlign: 'right',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                    {preset.label}
                  </span>
                  {isSelected && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--gold-primary)', color: '#000', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                      محدد
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher: Edit Form vs Live HTML Preview */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.35)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setActiveView('edit')}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            background: activeView === 'edit' ? 'var(--gold-primary)' : 'transparent',
            color: activeView === 'edit' ? '#000000' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          تعديل تفاصيل الحملة
        </button>
        <button
          type="button"
          onClick={() => setActiveView('preview')}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            background: activeView === 'preview' ? 'var(--gold-primary)' : 'transparent',
            color: activeView === 'preview' ? '#000000' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          معاينة شكل الإيميل الحقيقي للعميل
        </button>
      </div>

      {/* VIEW 1: Campaign Configuration Form */}
      {activeView === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Row 1: Email Subject & Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                عنوان الرسالة (يظهر في صندوق بريد العميل):
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="عنوان البريد الإلكتروني..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                شارة العرض العلوية (Badge):
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="مثال: عرض ترحيبي حصري / لفترة محدودة..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Row 2: Headline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              العنوان الرئيسي داخل الإيميل (Hero Headline):
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="العنوان البارز في صدر الرسالة..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 800
              }}
            />
          </div>

          {/* Row 3: Promo Code Card (Optional) */}
          <div style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--gold-primary)', display: 'block', marginBottom: '0.85rem' }}>
              بطاقة كود الخصم المذهبة (ستظهر كبطاقة كوبون فاخرة داخل الإيميل إذا حُدد كود):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  كود الخصم (Promo Code):
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="مثال: KEMET22 (اتركه فارغاً إن لم يكن هناك كود)"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFDF73',
                    fontSize: '1rem',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  توضيح قيمة أو نسبة الخصم:
                </label>
                <input
                  type="text"
                  value={discountNote}
                  onChange={(e) => setDiscountNote(e.target.value)}
                  placeholder="مثال: القطعة بـ 290 ج.م فقط بدلاً من 470 ج.م..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: '#10B981',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Body Text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              تفاصيل ورسالة العرض (يمكن كتابة فقرات متعددة):
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              placeholder="اكتب نص وتفاصيل العرض هنا..."
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                lineHeight: '1.7',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Row 5: CTA Button Text & Link */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                نص زر التسوق (CTA Button Text):
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="مثال: تسوّق الآن واستخدم كود الخصم..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                رابط المتجر الأساسي (Target URL):
              </label>
              <input
                type="text"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://kemetmisr.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  direction: 'ltr',
                  textAlign: 'left'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                نص زر قناة الواتساب (اختياري):
              </label>
              <input
                type="text"
                value={whatsappChannelText}
                onChange={(e) => setWhatsappChannelText(e.target.value)}
                placeholder="انضم لقناة الواتساب علشان يوصلك كل جديد قبل أي حد"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                رابط قناة الواتساب (WhatsApp Channel URL):
              </label>
              <input
                type="text"
                value={whatsappChannelUrl}
                onChange={(e) => setWhatsappChannelUrl(e.target.value)}
                placeholder="https://whatsapp.com/channel/..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  direction: 'ltr',
                  textAlign: 'left'
                }}
              />
            </div>
          </div>

          {/* Row 6: Image Showcase Management (Apple-Style Full Width Vertical Cards) */}
          <div style={{
            background: 'rgba(212, 175, 55, 0.04)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '1.35rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
              <div>
                <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>
                  📸 صور المنتجات المعروضة داخل الإيميل (Apple-Style Full-Width Vertical Cards)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  تُعرض كل صورة بالطول وبحجم كامل يملأ عرض الرسالة كبطاقات أبل الترويجية الفاخرة، لتبرز تفاصيل كل منتج بأعلى دقة.
                </span>
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 900, background: 'rgba(212, 175, 55, 0.18)', color: 'var(--gold-primary)', border: '1px solid var(--border-gold)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                عدد الصور: {images.length}
              </span>
            </div>

            {/* Add Image Inputs */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="أدخل رابط أي صورة مباشرة (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                style={{
                  flex: '1 1 280px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  direction: 'ltr',
                  textAlign: 'left'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddImage()}
                className="btn-primary"
                style={{ padding: '0.75rem 1.35rem', fontSize: '0.88rem', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                + إضافة الصورة
              </button>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isUploadingImage ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1.25rem',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: isUploadingImage ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}>
                <span>{isUploadingImage ? '⏳ جاري المعالجة والرفع...' : '📤 رفع صورة من جهازك'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Quick Preset Library */}
            <div style={{ marginBottom: '1.25rem', background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gold-primary)', display: 'block', marginBottom: '0.6rem' }}>
                ⚡ مكتبة المنتجات والتراكات الجاهزة (اضغط على أي تراك أو طقم لإضافته فورياً للحملة):
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {QUICK_LIBRARY_ITEMS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddImage(item.url)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img src={item.url} alt="" style={{ width: '22px', height: '22px', borderRadius: '3px', objectFit: 'cover' }} />
                    <span>+ {item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Currently Added Images List */}
            {images.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.75rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                لا توجد صور مضافة حالياً. اختر من المكتبة السريعة بالأعلى أو ارفع صوراً لعرضها بالطول داخل الإيميل.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{
                      background: 'var(--gold-primary)',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '0.78rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      minWidth: '32px',
                      textAlign: 'center'
                    }}>
                      #{idx + 1}
                    </span>

                    <div style={{
                      width: '58px',
                      height: '74px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      flexShrink: 0,
                      background: '#000'
                    }}>
                      <img
                        src={imgUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => {
                          const updated = [...images];
                          updated[idx] = e.target.value;
                          setImages(updated);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.85rem',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          direction: 'ltr',
                          textAlign: 'left'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, -1)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-color)',
                          color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                          borderRadius: '4px',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem'
                        }}
                        title="تحريك لأعلى"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMoveImage(idx, 1)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-color)',
                          color: idx === images.length - 1 ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                          borderRadius: '4px',
                          cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem'
                        }}
                        title="تحريك لأسفل"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          background: 'rgba(244, 63, 94, 0.15)',
                          border: '1px solid rgba(244, 63, 94, 0.4)',
                          color: '#F43F5E',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 800
                        }}
                        title="حذف الصورة"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Live HTML Email Mockup Preview (Dark Mode with Pure White Typography) */}
      {activeView === 'preview' && (
        <div style={{
          background: '#05080E',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(1rem, 3vw, 2.5rem)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Simulated Email Envelope Card (Matching Official Order Update Email Format) */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            padding: '24px 20px',
            direction: 'rtl',
            textAlign: 'right',
            color: '#0F172A'
          }}>
            {/* Email Header with Logo */}
            <div style={{
              textAlign: 'left',
              marginBottom: '20px',
              borderBottom: '1px solid #F1F5F9',
              paddingBottom: '14px'
            }}>
              <img
                src="https://kemetmisr.com/assets/kemet-text-logo.png"
                alt="KEMET"
                style={{ height: '32px', display: 'inline-block' }}
              />
            </div>

            {/* Badge if present */}
            {badge && (
              <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  {badge}
                </span>
              </div>
            )}

            {/* Main Headline */}
            <h2 style={{
              color: '#0F172A',
              fontSize: '1.35rem',
              fontWeight: 900,
              margin: '0 0 16px 0',
              lineHeight: 1.4,
              textAlign: 'right'
            }}>
              {headline || 'عنوان العرض الترويجي'}
            </h2>

            {/* Text Paragraphs */}
            <div style={{ margin: '16px 0', color: '#0F172A', fontSize: '0.96rem', lineHeight: 1.85 }}>
              {previewParagraphs.length > 0 ? (
                previewParagraphs.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 14px 0', fontWeight: 700, color: '#0F172A' }}>{p}</p>
                ))
              ) : (
                <p style={{ margin: 0, color: '#94A3B8' }}>اكتب تفاصيل الرسالة في تبويب التعديل لمعاينتها هنا...</p>
              )}
            </div>

            {/* Coupon Box if present */}
            {couponCode && (
              <div style={{
                background: '#F8FAFC',
                border: '1.5px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                margin: '18px 0'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  كود الخصم الحصري:
                </span>
                <div style={{
                  background: '#0F172A',
                  borderRadius: '6px',
                  padding: '6px 20px',
                  display: 'inline-block'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '3px' }}>
                    {couponCode}
                  </span>
                </div>
                {discountNote && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'block', marginTop: '6px' }}>
                    {discountNote}
                  </span>
                )}
              </div>
            )}

            {/* Apple-Style Vertical Showcase Cards (Full Width & Portrait) */}
            {images && images.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                margin: '24px 0 26px 0'
              }}>
                {images.map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      background: '#F8FAFC'
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`منتج ${idx + 1}`}
                      style={{
                        width: '100%',
                        maxHeight: '680px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Dual Action Buttons */}
            <div style={{ margin: '26px 0 18px 0', textAlign: 'center' }}>
              <a
                href={ctaUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.96rem',
                  padding: '13px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  marginBottom: '10px'
                }}
              >
                {ctaText}
              </a>

              {whatsappChannelText && whatsappChannelUrl && (
                <a
                  href={whatsappChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block',
                    background: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    padding: '13px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  {whatsappChannelText}
                </a>
              )}
            </div>

            {/* Email Footer */}
            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0 16px 0' }} />
            <p style={{ color: '#94A3B8', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
              KEMET — جميع الحقوق محفوظة &copy; 2026 (kemetmisr.com)
            </p>
          </div>
        </div>
      )}

      {/* Status Feedback Message */}
      {statusMsg && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.9rem 1.4rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
          fontWeight: 800,
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Send Action Button */}
      <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          سيتم إرسال الحملة بالشكل المعروض مباشرة إلى كافة الـ ({totalUsers}) عميل مسجل.
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest || isSending || !bodyText.trim()}
            style={{
              padding: '0.85rem 1.4rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-gold-bright)',
              color: 'var(--gold-primary)',
              borderRadius: 'var(--radius-md)',
              cursor: (isSendingTest || isSending || !bodyText.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isSendingTest || isSending || !bodyText.trim()) ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isSendingTest ? 'جاري إرسال التجربة...' : 'إرسال تجربة لبريدي فقط (amaarfekry5@gmail.com)'}
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={isSending || !bodyText.trim()}
            className="btn-primary"
            style={{
              padding: '0.9rem 2rem',
              fontSize: '0.92rem',
              fontWeight: 900,
              background: 'var(--gold-gradient)',
              color: '#000000',
              opacity: (isSending || !bodyText.trim()) ? 0.6 : 1,
              cursor: (isSending || !bodyText.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
            }}
          >
            {isSending ? 'جاري بث الحملة الترويجية...' : `إرسال العرض لكافة المستخدمين (${totalUsers} عميل)`}
          </button>
        </div>
      </div>

      {/* Confirmation Modal before Blast */}
      {isConfirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--gold-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '520px',
            width: '100%',
            direction: 'rtl',
            textAlign: 'right',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)', margin: '0 0 1rem 0' }}>
              تأكيد بث الحملة الترويجية بالبريد
            </h3>
            
            <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
              أنت على وشك إرسال هذه الحملة رسمياً بالبريد الإلكتروني إلى <strong>{totalUsers} عميل مسجل</strong> في متجر KEMET.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>عنوان الرسالة: </span>
                <strong style={{ color: 'var(--gold-primary)' }}>{subject}</strong>
              </div>
              {couponCode && (
                <div style={{ marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>كود الخصم المرفق: </span>
                  <strong style={{ color: '#FFDF73' }}>{couponCode}</strong>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>نص زر الشراء: </span>
                <strong style={{ color: '#10B981' }}>{ctaText}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '0.7rem 1.4rem', fontSize: '0.88rem', fontWeight: 700 }}
              >
                إلغاء ومراجعة التفاصيل
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="btn-primary"
                style={{
                  padding: '0.7rem 1.6rem',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  background: 'var(--gold-gradient)',
                  color: '#000000'
                }}
              >
                تأكيد وبدء الإرسال الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
