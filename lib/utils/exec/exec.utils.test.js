import assert from 'assert';
import { feedback } from '#utils';
import exec from './index.js';

/**
 * Test the exec function.
 */
async function testExec() {
  const command = 'echo Hello, World!';
  const expectedOutput = 'Hello, World!';

  const { stdout, stderr } = await exec(command);

  assert.strictEqual(stdout.trim(), expectedOutput);
  assert.strictEqual(stderr, '');

  feedback.success('exec test passed!');
}

testExec();
