import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function resolveServerPackageRoot(): string {
  const candidates = [join(__dirname, '..'), join(__dirname, '..', '..')];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
  }

  return join(__dirname, '..');
}

/** Absolute paths; first existing file wins (Nest ConfigModule). */
export function getEnvFilePaths(): string[] {
  const root = resolveServerPackageRoot();
  return [join(root, '.env.local'), join(root, '.env')];
}
