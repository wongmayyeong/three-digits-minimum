import { timingSafeEqual } from 'node:crypto';

/** Constant-time check of the admin bearer token. Without NEBUBE_ADMIN_TOKEN configured, creation is closed. */
export function isAdmin(req: Request): boolean {
  const token = process.env.NEBUBE_ADMIN_TOKEN;
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token || token.length < 24 || got.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(token));
}
