import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/analyzers': resolve(__dirname, './src/analyzers'),
      '@/generators': resolve(__dirname, './src/generators'),
      '@/recommenders': resolve(__dirname, './src/recommenders'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/api': resolve(__dirname, './src/api')
    }
  }
});