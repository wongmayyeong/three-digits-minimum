/** Structured JSON logs (one object per line) for the web app and worker. Never log secrets. */
type Level = 'debug' | 'info' | 'warn' | 'error';

const SECRET = /(sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|xi-api-key[^,}]*)/g;

export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...fields }).replace(SECRET, '[redacted]');
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
