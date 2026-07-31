import type { Metadata, Viewport } from 'next';
import { I18nProvider } from '@/i18n/i18n-provider';
import { ru } from '@/i18n/resources/ru';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: ru['meta.title'],
    template: '%s · BARAKASB',
  },
  description: ru['meta.description'],
  openGraph: {
    title: ru['meta.openGraphTitle'],
    description: ru['meta.openGraphDescription'],
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: ru['meta.openGraphAlt'],
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: ru['meta.openGraphTitle'],
    description: ru['meta.openGraphDescription'],
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f7f9fd',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
