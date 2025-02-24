import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/main.ts'],
  format: ['esm'],
  target: 'esnext',
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  dts: false,
  minify: false,
  minifyWhitespace: false,
  tsconfig: 'tsconfig.json',
});
