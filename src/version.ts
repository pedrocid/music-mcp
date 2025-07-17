import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | undefined;

export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Find package.json relative to this file (CommonJS)
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    cachedVersion = packageJson.version || '1.0.0';
    return cachedVersion!;
  } catch (error) {
    // Fallback version if package.json can't be read
    cachedVersion = '1.0.0';
    return cachedVersion!;
  }
} 