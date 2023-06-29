import { join } from 'path';

import getAbsoluteLibDirPath from './index.js';

describe('getAbsoluteLibDirPath utils', () => {
  test('Should get the absolute path of the lib directory based on the current module.', async () => {
    const expectedOutput = join(process.cwd(), 'lib');

    const result = getAbsoluteLibDirPath();

    expect(result).toBe(expectedOutput);
  });
});
