import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/mona-sans/standard.css';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/brand';
import { MotionProvider } from '@/components/motion-provider';

const base = process.env.NEBUBE_PUBLIC_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: 'NEBUBE: Judged on the evidence, not the conviction', template: '%s · NEBUBE' },
  description: 'Watch two AI analysts argue the bull and bear case for NEAR from one frozen, sourced evidence snapshot. A neutral AI judge scores the evidence, not the conviction.',
  applicationName: 'NEBUBE',
  openGraph: {
    type: 'website',
    siteName: 'NEBUBE',
    title: 'NEBUBE: Every claim has an opponent.',
    description: 'Three minds. One evidence trail. Your NEAR thesis, on trial.',
  },
  twitter: { card: 'summary_large_image', title: 'NEBUBE: Every claim has an opponent.', description: 'Three minds. One evidence trail. Your NEAR thesis, on trial.' },
};

export const viewport: Viewport = {
  themeColor: '#060a08',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-mint focus:px-3 focus:py-2 focus:text-mint-ink">Skip to content</a>
        <MotionProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
