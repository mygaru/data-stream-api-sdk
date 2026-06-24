import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

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
    entry: { dsa: 'src/browser.ts' },
    format: ['iife'],
    platform: 'browser',
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    banner: { js: `/* @mygaru/data-stream-api-sdk v${version} */` },
  },
]);
