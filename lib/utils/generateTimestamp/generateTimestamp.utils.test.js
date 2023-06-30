import generateTimestamp from './index.js';

describe('generateTimestamp utils', () => {
  test('Should generate a timestamp string in the format "YYYYMMDDHHmmss".', async () => {
    const timestamp = generateTimestamp();
    const regex = /^\d{14}$/;

    expect(timestamp).toMatch(regex);
  });
});
