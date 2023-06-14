import assert from 'assert';
import generateTimestamp from './index.js';

/**
 * Test the generateTimestamp function.
 */
function testGenerateTimestamp() {
  const timestamp = generateTimestamp();
  const regex = /^\d{14}$/;

  assert(regex.test(timestamp), 'Invalid timestamp format');
  console.log('generateTimestamp test passed!');
}

testGenerateTimestamp();
