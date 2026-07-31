import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { UniversalApplicationShell } from '@/features/universal-application/presentation/universal-application-shell';
import { ru } from '@/i18n/resources/ru';

export const metadata: Metadata = {
  applicationName: 'BARAKASB',
  title: ru['universal.metaTitle'],
  description: ru['universal.metaDescription'],
  manifest: '/barakasb-app.webmanifest',
  icons: {
    icon: '/icons/barakasb-app.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BARAKASB',
  },
};

export default function UniversalApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <UniversalApplicationShell>{children}</UniversalApplicationShell>;
}
