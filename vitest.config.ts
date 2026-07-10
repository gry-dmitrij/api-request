import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    env: {
      TZ: 'UTC',
    },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-utils/setup/fix-request.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // Exclude tests, test helpers and type-only files (interfaces have no runtime code).
      exclude: ['src/**/*.test.ts', 'src/test-utils/**', 'src/**/I*.ts'],
    },
  },
});
