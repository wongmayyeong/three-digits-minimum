/**
 * Durable storage for audio assets. Two drivers:
 *  - "db" (default): bytes stored in PostgreSQL alongside metadata. One backup covers all state.
 *  - "s3": any S3-compatible bucket (AWS S3, Cloudflare R2, Supabase Storage S3 endpoint).
 */
import { db } from '@/lib/storage/db';

export type StorageDriver = 'db' | 's3';

export function storageDriver(): StorageDriver {
  return process.env.ASSET_STORAGE === 's3' ? 's3' : 'db';
}

async function s3() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  const required = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`S3 storage selected but ${missing.join(', ')} not set`);
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  });
}

export async function putObject(key: string, bytes: Buffer, mimeType: string): Promise<{ driver: StorageDriver; key: string; inline: Buffer | null }> {
  if (storageDriver() === 'db') return { driver: 'db', key, inline: bytes };
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  await (await s3()).send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: bytes, ContentType: mimeType, CacheControl: 'public, max-age=31536000, immutable' }));
  return { driver: 's3', key, inline: null };
}

export async function getAudioBytes(assetId: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const a = await db().audioAsset.findUnique({ where: { id: assetId } });
  if (!a) return null;
  if (a.storageDriver === 'db') return a.data ? { bytes: Buffer.from(a.data), mimeType: a.mimeType } : null;
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const out = await (await s3()).send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: a.storageKey }));
  const body = await out.Body?.transformToByteArray();
  return body ? { bytes: Buffer.from(body), mimeType: a.mimeType } : null;
}
