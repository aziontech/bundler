import { defineConfig } from 'azion';

const config = defineConfig({
  build: {
    preset: {
      name: 'emscripten',
    },
  },
  rules: {
    request: [
      {
        name: 'Execute Edge Function',
        match: '^\\/',
        behavior: {
          runFunction: {
            path: '.edge/worker.js',
          },
        },
      },
    ],
  },
});

export default config;
