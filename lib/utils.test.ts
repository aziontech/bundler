import { jest } from '@jest/globals';
import { debug, generateTimestamp } from './utils';

describe('debug utils', () => {
  let originalDebugValue: string | undefined;

  beforeAll(() => {
    originalDebugValue = process.env.DEBUG;
  });

  afterAll(() => {
    process.env.DEBUG = originalDebugValue;
    jest.restoreAllMocks();
  });

  test('Should log if debug flag is enabled', () => {
    process.env.DEBUG = 'true';

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    debug.error('test');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toBe('test');

    consoleSpy.mockRestore();
  });

  test('Should NOT log if debug flag is disabled', () => {
    process.env.DEBUG = 'false';
    jest.resetModules();

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    debug.error('test');

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('generateTimestamp utils', () => {
  test('Should generate a timestamp string in the format "YYYYMMDDHHmmss"', () => {
    const timestamp = generateTimestamp();
    const regex = /^\d{14}$/;

    expect(timestamp).toMatch(regex);
  });
});
