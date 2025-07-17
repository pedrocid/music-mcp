import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    exclude: ['tests/unit/**/*'],
    timeout: 30000,
    testTimeout: 30000
  }
}); 