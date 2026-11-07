import { getAudioBytes } from '@/lib/storage/assets';
import { apiError } from '@/lib/security/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/audio/:assetId : stored, immutable audio with HTTP Range support for seeking. */
export async function GET(req: Request, ctx: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await ctx.params;
  if (!/^[a-z0-9]{20,32}$/.test(assetId)) return apiError('not_found', 'Audio not found.', 404);
  const a = await getAudioBytes(assetId);
  if (!a) return apiError('not_found', 'Audio not found.', 404);
  const total = a.bytes.length;
  const base = { 'content-type': a.mimeType, 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable' };
  const range = req.headers.get('range');
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (m) {
    let start = m[1] ? Number(m[1]) : total - Number(m[2] || 0);
    let end = m[1] && m[2] ? Number(m[2]) : total - 1;
    if (!m[1]) { start = Math.max(0, start); end = total - 1; }
    if (start >= total || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
    end = Math.min(end, total - 1);
    return new Response(new Uint8Array(a.bytes.subarray(start, end + 1)), { status: 206, headers: { ...base, 'content-range': `bytes ${start}-${end}/${total}`, 'content-length': String(end - start + 1) } });
  }
  return new Response(new Uint8Array(a.bytes), { status: 200, headers: { ...base, 'content-length': String(total) } });
}
