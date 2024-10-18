import { defineConfig } from 'azion';

export default defineConfig({
  build: {
    preset: {
      name: 'rustwasm',
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
