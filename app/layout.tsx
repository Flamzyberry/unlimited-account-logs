import type { Metadata } from 'next';
import './globals.css';
import FloatingContactTabs from '@/components/FloatingContactTabs';

export const metadata: Metadata = { title: 'Unlimited Digital Marketplace', description: 'A modern marketplace for lawful digital products and services.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FloatingContactTabs />
      </body>
    </html>
  );
}