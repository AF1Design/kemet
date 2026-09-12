'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getAnnouncementBarConfigAction, saveAnnouncementBarConfigAction } from '../../app/admin/actions';
import { DEFAULT_ANNOUNCEMENT_CONFIG } from '../../lib/announcement';

export function AnnouncementBarControl() {
  const [config, setConfig] = useState(DEFAULT_ANNOUNCEMENT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState(null);

  // Form State
  const [isActive, setIsActive] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(4);
  const [slide1Text, setSlide1Text] = useState('');
  const [slide1Code, setSlide1Code] = useState('');
  const [slide2Text, setSlide2Text] = useState('');
  const [slide2Code, setSlide2Code] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getAnnouncementBarConfigAction();
        if (res.success && res.config) {
          const cfg = res.config;
          setConfig(cfg);
          setIsActive(cfg.isActive !== false);
          setIntervalSeconds(Number(cfg.intervalSeconds || 4));
          const s1 = cfg.slides?.[0] || {};
          const s2 = cfg.slides?.[1] || {};
          setSlide1Text(s1.text || '');
          setSlide1Code(s1.code || '');
          setSlide2Text(s2.text || '');
          setSlide2Code(s2.code || '');
        }
      } catch (err) {
        console.warn('Load banner config error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleActive = (newVal) => {
    setIsActive(newVal);
    setStatusMsg({ type: 'info', text: 'جاري حفظ حالة الشريط في قاعدة البيانات...' });

    const updatedConfig = {
      ...config,
      isActive: newVal,
      intervalSeconds: Number(intervalSeconds) || 4,
      slides: [
        {
          text: slide1Text.trim(),
          code: slide1Code.trim().toUpperCase()
        },
        {
          text: slide2Text.trim(),
          code: slide2Code.trim().toUpperCase()
        }
      ].filter(s => Boolean(s.text))
    };

    startTransition(async () => {
      const res = await saveAnnouncementBarConfigAction(updatedConfig);
      if (res.success) {
        setConfig(updatedConfig);
        setStatusMsg({
          type: 'success',
          text: newVal
            ? 'تم تفعيل الشريط الإعلاني بنجاح، ويظهر الآن لجميع الزوار.'
            : 'تم إيقاف وتعطيل الشريط الإعلاني بنجاح، ولن يظهر للزوار بعد الآن.'
        });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل حفظ الإعدادات، يرجى المحاولة لاحقاً.' });
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const updatedConfig = {
      isActive: isActive,
      intervalSeconds: Number(intervalSeconds) || 4,
      slides: [
        {
          text: slide1Text.trim(),
          code: slide1Code.trim().toUpperCase()
        },
        {
          text: slide2Text.trim(),
          code: slide2Code.trim().toUpperCase()
        }
      ].filter(s => Boolean(s.text))
    };

    startTransition(async () => {
      const res = await saveAnnouncementBarConfigAction(updatedConfig);
      if (res.success) {
        setConfig(updatedConfig);
        setStatusMsg({ type: 'success', text: 'تم حفظ وتحديث إعدادات الشريط الإعلاني بنجاح، وتنعكس التغييرات فوراً لجميع الزوار.' });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل حفظ الإعدادات، يرجى المحاولة لاحقاً.' });
      }
    });
  };

  if (isLoading) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        جاري تحميل إعدادات الشريط الإعلاني...
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.75rem',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', margin: 0 }}>
            إدارة الشريط الإعلاني العلوي (Announcement Bar)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
            التحكم في الرسائل الترويجية وأكواد الخصم التي تظهر في أعلى شاشة المتجر
          </p>
        </div>

        {/* Live Active Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isActive ? '#10B981' : 'var(--text-secondary)' }}>
            {isActive ? 'الشريط مفعّل وظاهر للزوار' : 'الشريط متوقف ومخفي'}
          </span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => handleToggleActive(e.target.checked)}
            disabled={isPending}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </label>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontSize: '0.88rem',
          fontWeight: 700,
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: statusMsg.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Live Preview Box */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
          معاينة مباشرة لشكل الشريط في أعلى المتجر:
        </div>
        <div style={{
          background: 'linear-gradient(90deg, #8E6516 0%, #B88924 30%, #C9962D 50%, #B88924 70%, #8E6516 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          fontFamily: "var(--font-ar), 'Cairo', sans-serif"
        }}>
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.4, letterSpacing: 'normal' }}>
            {slide1Text || 'نص العرض الترويجي'}
          </span>
          {slide1Code && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.15rem 0.65rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              fontFamily: "var(--font-en), monospace"
            }}>
              <span style={{ letterSpacing: '0.5px' }}>{slide1Code}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: "var(--font-ar), 'Cairo', sans-serif", background: 'rgba(255, 255, 255, 0.22)', padding: '0.08rem 0.4rem', borderRadius: '12px' }}>
                نسخ
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Slide 1 */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.03)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            الرسالة الأولى (العرض الرئيسي)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                نص الرسالة
              </label>
              <input
                type="text"
                value={slide1Text}
                onChange={(e) => setSlide1Text(e.target.value)}
                placeholder="مثال: عرض القطعتين: 450 ج.م بدلاً من 940 (225 للقطعة)"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-deep)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                كود الخصم للنسخ السريع (اختياري)
              </label>
              <input
                type="text"
                value={slide1Code}
                onChange={(e) => setSlide1Code(e.target.value.toUpperCase())}
                placeholder="مثال: KEMETMISR"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-deep)',
                  color: 'var(--gold-primary)',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Slide 2 */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.03)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            الرسالة الثانية (العرض البديل أو الترويجي)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                نص الرسالة
              </label>
              <input
                type="text"
                value={slide2Text}
                onChange={(e) => setSlide2Text(e.target.value)}
                placeholder="مثال: عرض القطعة الواحدة: 290 ج.م بدلاً من 470"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-deep)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                كود الخصم للنسخ السريع (اختياري)
              </label>
              <input
                type="text"
                value={slide2Code}
                onChange={(e) => setSlide2Code(e.target.value.toUpperCase())}
                placeholder="مثال: KEMET22"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-deep)',
                  color: 'var(--gold-primary)',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Speed & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              سرعة تبديل الرسائل (بالثواني):
            </label>
            <input
              type="number"
              min="2"
              max="15"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(e.target.value)}
              style={{
                width: '70px',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                fontWeight: 800
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
            style={{
              padding: '0.75rem 2rem',
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? 'جاري حفظ التعديلات...' : 'حفظ ونشر التعديلات'}
          </button>
        </div>

      </form>
    </div>
  );
}
