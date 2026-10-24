import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Minimal .env loader: KEY=VALUE lines, # comments, optional quotes. */
export function loadEnv(path = resolve(process.cwd(), '.env')): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
}
