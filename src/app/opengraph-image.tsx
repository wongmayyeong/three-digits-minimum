import { ImageResponse } from 'next/og';

export const alt = 'NEBUBE: Every claim has an opponent.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function star(cx: number, cy: number, r: number) {
  const p = r * 0.18;
  return `M${cx} ${cy - r} C${cx + p} ${cy - p} ${cx + p} ${cy - p} ${cx + r} ${cy} C${cx + p} ${cy + p} ${cx + p} ${cy + p} ${cx} ${cy + r} C${cx - p} ${cy + p} ${cx - p} ${cy + p} ${cx - r} ${cy} C${cx - p} ${cy - p} ${cx - p} ${cy - p} ${cx} ${cy - r}Z`;
}

export default function OG() {
  const stars = [[980, 110, 14], [1080, 240, 7], [880, 300, 5], [1120, 470, 10], [760, 120, 4], [1010, 560, 5]];
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#060a08', color: '#f2f1e9', padding: '72px 80px', fontFamily: 'sans-serif', position: 'relative' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          {stars.map(([x, y, r], i) => <path key={i} d={star(x!, y!, r!)} fill="#00ec97" opacity={0.55} />)}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path d="M5.5 25.5C4.2 16.6 7.6 9.2 14 5.2" stroke="#00ec97" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M26.5 25.5C27.8 16.6 24.4 9.2 18 5.2" stroke="#f2f1e9" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d={star(16, 18.5, 6.2)} fill="#00ec97" />
          </svg>
          <span style={{ fontSize: 34, letterSpacing: 6, fontWeight: 700 }}>NEBUBE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: -3, fontWeight: 600 }}>Every claim has</span>
          <span style={{ fontSize: 92, lineHeight: 1.05, letterSpacing: -3, fontWeight: 600 }}>an opponent.</span>
          <span style={{ marginTop: 28, fontSize: 32, color: '#c9cdc5' }}>Three minds. One evidence trail. Your NEAR thesis, on trial.</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#949f98' }}>
          <span>Judged on the evidence, not the conviction.</span>
          <span style={{ color: '#00ec97' }}>AI debate arena · NEAR research</span>
        </div>
      </div>
    ),
    size,
  );
}
