import assert from 'assert';
import { feedback } from '#utils';
import generateTimestamp from './index.js';

/**
 * Test the generateTimestamp function.
 */
function testGenerateTimestamp() {
  const timestamp = generateTimestamp();
  const regex = /^\d{14}$/;

  assert(regex.test(timestamp), 'Invalid timestamp format');
  feedback.success('generateTimestamp test passed!');
}

testGenerateTimestamp();
