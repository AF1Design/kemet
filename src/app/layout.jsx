import '../styles/global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'KEMET | Build Your Legacy',
  description: 'المتجر الرسمي لبراند KEMET لأحدث أطقم كرة القدم الرسمية موديلات 2027 خامة (Player Edition) والملابس الرياضية الفاخرة.',
  keywords: ['KEMET', 'Build Your Legacy', 'كيميت', 'أطقم 2027', 'ريال مدريد', 'أتلتيكو مدريد', 'بلاير اديشن', 'Player Edition'],
  manifest: '/site.webmanifest',
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
    description: 'تسوق أحدث أطقم كرة القدم والملابس الرياضية موديلات 2027 (Player Edition) بسعر حصري 280 ج.م',
    url: 'https://kemet.co',
    siteName: 'KEMET',
    images: [
      {
        url: '/assets/kemet-og-image.png',
        width: 2400,
        height: 1260,
        alt: 'KEMET Official Emblem Social Preview',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEMET | Build Your Legacy',
    description: 'المتجر الرسمي لبراند KEMET لأحدث أطقم كرة القدم والملابس الرياضية الفاخرة 2027.',
    images: ['/assets/kemet-og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
