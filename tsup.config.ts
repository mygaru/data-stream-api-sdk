import { defineConfig } from 'tsup';

export default defineConfig([
  {
    tsconfig: 'tsconfig.build.json',
    sourcemap: true,
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'es2020',
    outDir: 'dist',
  },
  {
    tsconfig: 'tsconfig.build.json',
    sourcemap: true,
    entry: { browser: 'src/browser.ts' },
    format: ['iife'],
    platform: 'browser',
    clean: false,
    target: 'es2020',
    outDir: 'dist',
  },
]);
