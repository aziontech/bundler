import { writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import overrideStaticOutputPath from './index.js';

const CONFIG_FILE_PATH = join(tmpdir(), 'config.json');

describe('overrideStaticOutputPath utils', () => {
  beforeAll(() => {
    writeFileSync(CONFIG_FILE_PATH, `
    {
      other: true,
      publicOut: "./public",
      another: "x"
    }
    `);
  });

  test('Should override the output path for static files in a provided configuration file.', async () => {
    const expectedOutput = `
    {
      other: true,
      publicOut: "./out",
      another: "x"
    }
    `;

    overrideStaticOutputPath(CONFIG_FILE_PATH, /publicOut:(.*),\n/, '"./out"');

    const result = readFileSync(CONFIG_FILE_PATH, 'utf-8');

    expect(result).toBe(expectedOutput);
  });
});
