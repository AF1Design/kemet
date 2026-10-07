/**
 * Default Announcement Bar Configuration
 * Stored in a separate client/server safe module to satisfy Next.js "use server" export constraints.
 */
export const DEFAULT_ANNOUNCEMENT_CONFIG = {
  isActive: true,
  intervalSeconds: 5,
  slides: [
    {
      text: 'كود خصم kemet12: شحن مجاني لجميع محافظات مصر لفترة محدودة!',
      code: 'kemet12',
      expiresAt: '2026-10-09T13:30:00.000Z'
    },
    {
      text: 'عرض القطعتين: 450 ج.م بدلاً من 940 (225 للقطعة)',
      code: 'KEMETMISR'
    },
    {
      text: 'عرض القطعة الواحدة: 290 ج.م بدلاً من 470',
      code: 'KEMET22'
    }
  ]
};
