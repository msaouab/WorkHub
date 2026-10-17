import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/spaces',
  test: {
    name: 'spaces',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    passWithNoTests: true,
    reporters: ['default'],
    fileParallelism: false,
  },
}));
