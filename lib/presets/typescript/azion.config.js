import { defineConfig } from 'azion';

export default defineConfig({
  build: {
    preset: {
      name: 'typescript',
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
