import assert from 'assert';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getPackageVersion from './index.js';

const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, 'package.json');

/**
 * Run test before actions to setup the test env
 */
function setup() {
  writeFileSync(FILE_PATH, `
  {
    "dependencies": {
      "next": "13.3.4"
    }
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
 * Test the getPackageVersion function - founded package case.
 */
function testGetPackageVersion() {
  setup();

  const version = getPackageVersion('next');

  assert(version, '13.3.4');
  console.log('getPackageVersion test passed!');

  teardown();
}

/**
 * Test the getPackageVersion function - invalid package name.
 */
function testGetPackageVersionInvalidPackageName() {
  setup();

  try {
    getPackageVersion('');
  } catch (error) {
    assert.strictEqual(error.message, 'Invalid package name!');
    console.log('getPackageVersion (invalid package name) test passed!');
  }

  teardown();
}

/**
 * Test the getPackageVersion function - package not found.
 */
function testGetPackageVersionPackageNotFound() {
  setup();

  try {
    getPackageVersion('other');
  } catch (error) {
    assert.strictEqual(error.message, 'other not detected in project dependencies!');
    console.log('getPackageVersion (package not found) test passed!');
  }

  teardown();
}

testGetPackageVersion();
testGetPackageVersionInvalidPackageName();
testGetPackageVersionPackageNotFound();
