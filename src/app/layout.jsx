import '../styles/global.css';
import { Providers } from './providers';
import { AnalyticsScripts } from '../lib/analytics/AnalyticsScripts';
import { NavigationTracker } from '../lib/analytics/NavigationTracker';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kemetmisr.com';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'KEMET | Build Your Legacy',
    template: '%s | KEMET Build Your Legacy',
  },
  description: 'تسوق أحدث الأطقم الرياضية بأعلى جودة وأسرع خدمة توصيل وضمان مميز على جميع المنتجات',
  keywords: [
    'KEMET',
    'Build Your Legacy',
    'كيميت',
    'براند كيميت',
    'أطقم 2027',
    'أطقم كرة قدم 2027',
    'ريال مدريد 2027',
    'أهلي وزمالك 2027',
    'بلاير اديشن',
    'Player Edition',
    'ملابس جيم رياضية',
    'شورتات رياضية',
    'متجر رياضي مصري'
  ],
  manifest: '/site.webmanifest',
  alternates: {
    canonical: './',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'KEMET | Build Your Legacy',
    description: 'تسوق أحدث الأطقم الرياضية بأعلى جودة وأسرع خدمة توصيل وضمان مميز على جميع المنتجات',
    url: baseUrl,
    siteName: 'Kemet | كيميت',
    images: [
      {
        url: '/assets/kemet-og-image.png',
        width: 1200,
        height: 630,
        alt: 'KEMET Build Your Legacy Official Banner',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEMET | Build Your Legacy',
    description: 'تسوق أحدث الأطقم الرياضية بأعلى جودة وأسرع خدمة توصيل وضمان مميز على جميع المنتجات',
    images: ['/assets/kemet-og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  // Organization JSON-LD Structured Data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kemet | كيميت',
    alternateName: 'KEMET',
    url: baseUrl,
    logo: `${baseUrl}/assets/kemet-emblem-icon.png`,
    description: 'تسوق أحدث الأطقم الرياضية بأعلى جودة وأسرع خدمة توصيل وضمان مميز على جميع المنتجات',
    sameAs: [
      'https://www.facebook.com/share/18tVb5nvWy/?mibextid=wwXIfr',
      'https://www.instagram.com/kemetbrand.eg?igsh=bmxka2pzcGxyMDdy',
      'https://www.tiktok.com/@kemet.ya?_r=1&_t=ZS-98bdUO43owB',
      'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+201114687759',
      contactType: 'customer service',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English']
    }
  };

  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Inject Organization JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <AnalyticsScripts />
        <NavigationTracker />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
