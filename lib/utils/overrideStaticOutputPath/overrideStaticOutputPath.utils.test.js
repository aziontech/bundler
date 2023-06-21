import assert from 'assert';
import { writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import overrideStaticOutputPath from './index.js';

const CONFIG_FILE_PATH = join(tmpdir(), 'config.json');

/**
 * Setup env to test
 */
function setup() {
  writeFileSync(CONFIG_FILE_PATH, `
  {
    other: true,
    publicOut: "./public",
    another: "x"
  }
  `);
}

/**
 * Test the overrideStaticOutputPath function.
 */
async function testOverrideStaticOutputPath() {
  setup();

  const expectedOutput = `
  {
    other: true,
    publicOut: "./out",
    another: "x"
  }
  `;

  overrideStaticOutputPath(CONFIG_FILE_PATH, /publicOut:(.*),\n/, '"./out"');

  const result = readFileSync(CONFIG_FILE_PATH, 'utf-8');

  assert.strictEqual(result, expectedOutput);

  console.log('overrideStaticOutputPath test passed!');
}

testOverrideStaticOutputPath();
