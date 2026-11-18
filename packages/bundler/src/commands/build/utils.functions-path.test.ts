import { describe, it, expect } from '@jest/globals';
import { getFunctionPathsFromEntry } from './utils';

describe('getFunctionPathsFromEntry', () => {
  it('uses the name of the entry file', async () => {
    await expect(getFunctionPathsFromEntry('src/index.js')).resolves.toEqual([
      './functions/index.js',
    ]);
  });

  it('keeps the order of an entry array', async () => {
    await expect(getFunctionPathsFromEntry(['a.js', 'b/c.ts'])).resolves.toEqual([
      './functions/a.js',
      './functions/c.js',
    ]);
  });

  it('uses the keys of an entry object', async () => {
    await expect(getFunctionPathsFromEntry({ 'nested/main': 'src/index.js' })).resolves.toEqual([
      './functions/nested/main.js',
    ]);
  });
});
