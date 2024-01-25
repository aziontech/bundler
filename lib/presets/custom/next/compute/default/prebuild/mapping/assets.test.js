import mockFs from 'mock-fs';
import { assetsPaths } from './assets.js';

describe('Assets path', () => {
  it('Should generate assets map', async () => {
    mockFs({
      '.vercel': {
        output: {
          static: {
            'favicon.ico': 'favicon.ico',
            'vercel.svg': 'vercel.svg',
          },
        },
      },
    });

    const paths = assetsPaths('.vercel');

    expect(paths).toEqual([
      '/output/static/favicon.ico',
      '/output/static/vercel.svg',
    ]);

    mockFs.restore();
  });
});
