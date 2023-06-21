import assert from 'assert';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getProjectPackageJson from './index.js';

const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, 'package.json');

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
 * Test the overrideStaticOutputPath function.
 */
async function testGetProjectPackageJson() {
  setup();

  const expectedOutput = {
    name: 'next',
    version: '0.1.0',
  };

  getProjectPackageJson();

  const result = getProjectPackageJson();

  assert.strictEqual(result.name, expectedOutput.name);
  assert.strictEqual(result.version, expectedOutput.version);

  console.log('getProjectPackageJson test passed!');

  teardown();
}

testGetProjectPackageJson();
