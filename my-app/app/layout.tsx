import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AppStatus from '@/components/app-status';
import './globals.css';
export const metadata: Metadata = {
  title: 'WYD Messenger',
  description: 'QR로 만나고 각자의 언어로 소통하는 WYD Messenger',
  applicationName: 'WYD Messenger',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'WYD' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffefb' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ko" className="h-full antialiased"><body className="min-h-full flex flex-col"><AppStatus />{children}</body></html>;
}
