import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { FeedProvider } from '@/context/FeedContext';

export const metadata: Metadata = {
  title: 'ShortClip - Next-Gen Short Video Platform',
  description: 'Ultra-fast, responsive short clip streaming web application built with Next.js and TypeScript.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FeedProvider>{children}</FeedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
