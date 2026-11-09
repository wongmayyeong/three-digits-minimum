import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/mona-sans/standard.css';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-700.css';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/brand';
import { MotionProvider } from '@/components/motion-provider';

const base = process.env.NEBUBE_PUBLIC_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: 'Three Digits, Minimum? How far can NEAR really go', template: '%s · Three Digits, Minimum?' },
  description: 'An evidence-based NEAR investment thesis. What NEAR would have to achieve for $10, $25, $50 and $100, checked against live adoption, token-economics and valuation data, opened by an AI Bull vs Bear debate.',
  applicationName: 'Three Digits, Minimum?',
  openGraph: {
    type: 'website',
    siteName: 'Three Digits, Minimum?',
    title: 'Three Digits, Minimum?',
    description: 'How far can NEAR really go? An evidence-based NEAR price ladder.',
  },
  twitter: { card: 'summary_large_image', title: 'Three Digits, Minimum?', description: 'How far can NEAR really go? An evidence-based NEAR price ladder.' },
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
