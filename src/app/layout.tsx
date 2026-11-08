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
  title: { default: 'Is NEAR Building the Future or Following the Hype?', template: '%s · Building or Hype?' },
  description: 'A reproducible NEAR investment thesis. Every pivot, from Social and BOS to Chain Abstraction, Intents and AI, tested against live onchain and market data, opened by an AI Bull vs Bear debate.',
  applicationName: 'Building or Hype?',
  openGraph: {
    type: 'website',
    siteName: 'Building or Hype?',
    title: 'Is NEAR Building the Future or Following the Hype?',
    description: 'Every pivot, tested against the evidence.',
  },
  twitter: { card: 'summary_large_image', title: 'Is NEAR Building the Future or Following the Hype?', description: 'Every pivot, tested against the evidence.' },
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
