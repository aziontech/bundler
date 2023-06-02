import path from 'path';

export default {
  output: {
    path: path.join(process.cwd(), 'out'),
    filename: 'worker.js',
    globalObject: 'this',
  },
  mode: 'production',
  target: 'webworker',
  plugins: [],
};
