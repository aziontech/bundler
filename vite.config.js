import { resolve } from 'path';
import { defineConfig } from 'vite';
import { chmod } from 'fs/promises';

export default defineConfig({
  plugins: [
    {
      name: 'make-executable',
      closeBundle: async () => {
        await chmod(resolve(__dirname, 'dist/index.js'), 0o755);
      },
    },
  ],
  resolve: {
    alias: {
      '#root': resolve(__dirname, './'),
      '#lib': resolve(__dirname, './lib'),
      '#types': resolve(__dirname, './lib/types.ts'),
      '#utils': resolve(__dirname, './lib/utils.ts'),
      '#build': resolve(__dirname, './lib/build/build.ts'),
      '#env': resolve(__dirname, './lib/env/index.ts'),
      '#constants': resolve(__dirname, './lib/constants.ts'),
      '#commands': resolve(__dirname, './lib/commands/index.ts'),
    },
  },
  build: {
    target: 'node18',
    ssr: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'lib/main.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => {
        return `${entryName}.js`;
      },
    },
    rollupOptions: {
      external: (id) => {
        if (id.includes('node_modules')) return true;

        const deps = [
          '@edge-runtime/primitives',
          '@netlify/framework-info',
          'azion',
          'chokidar',
          'commander',
          'cosmiconfig',
          'cosmiconfig-typescript-loader',
          'edge-runtime',
          'lodash',
          'prettier',
          'semver',
          'typescript',
        ];

        return deps.some((dep) => id === dep || id.startsWith(`${dep}/`));
      },
      output: {
        exports: 'named',
      },
    },
    minify: true,
  },
});
