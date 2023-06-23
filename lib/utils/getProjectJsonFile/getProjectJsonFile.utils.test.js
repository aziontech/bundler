import assert from 'assert';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getProjectJsonFile from './index.js';

const FILE_NAME = 'package.json';
const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, FILE_NAME);

/**
 * Run test before actions to setup the test env
 */
function setup() {
  writeFileSync(FILE_PATH, `
  {
    "name": "next",
    "version": "0.1.0"
  }
  `);

  process.chdir(TMP_DIR);
}

/**
 * Run test after actions
 */
function teardown() {
  process.chdir(CURRENT_DIR);
}

/**
 * Test the getProjectJsonFile function.
 */
async function testGetProjectJsonFile() {
  setup();

  const expectedOutput = {
    name: 'next',
    version: '0.1.0',
  };

  const result = getProjectJsonFile(FILE_NAME);

  assert.strictEqual(result.name, expectedOutput.name);
  assert.strictEqual(result.version, expectedOutput.version);

  console.log('getProjectJsonFile test passed!');

  teardown();
}

testGetProjectJsonFile();
