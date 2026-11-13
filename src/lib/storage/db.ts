import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __thesisPrisma?: PrismaClient };

function create(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. See .env.example.');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 10) }) });
}

/** Lazily created singleton, so importing this module never connects at build time. */
export function db(): PrismaClient {
  if (!globalForPrisma.__thesisPrisma) globalForPrisma.__thesisPrisma = create();
  return globalForPrisma.__thesisPrisma;
}
