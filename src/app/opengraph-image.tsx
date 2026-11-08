import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Is NEAR Building the Future or Following the Hype? Every pivot, tested against the evidence.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  const stage = `data:image/webp;base64,${readFileSync(join(process.cwd(), 'public/stage/studio.webp')).toString('base64')}`;
  const mark = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/logo-mark.png')).toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#060a08', color: '#f2f1e9', fontFamily: 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stage} width={1200} height={630} style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, objectFit: 'cover', opacity: 0.45 }} alt="" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, rgba(6,10,8,0.95) 0%, rgba(6,10,8,0.75) 55%, rgba(6,10,8,0.2) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={84} height={84} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 860 }}>
            <span style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -2.5, fontWeight: 600 }}>Is NEAR Building the Future or Following the Hype?</span>
            <span style={{ marginTop: 24, fontSize: 32, color: '#c9cdc5' }}>Every pivot, tested against the evidence.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#949f98' }}>
            <span>Reproducible NEAR investment thesis · live data · AI debate</span>
            <span style={{ color: '#00ec97' }}>Not financial advice</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
