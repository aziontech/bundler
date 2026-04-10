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
  build: {
    target: 'node18',
    ssr: true,
    lib: {
      entry: {
        index: resolve(__dirname, './src/main.ts'),
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
          '@aziontech/builder',
          '@aziontech/bundler-telemetry',
          '@aziontech/config',
          '@aziontech/utils',
          '@aziontech/presets',
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
