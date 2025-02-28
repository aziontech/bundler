import { jest } from '@jest/globals';

describe('debug utils', () => {
  let originalDebugValue: string | undefined;

  beforeAll(() => {
    originalDebugValue = process.env.DEBUG;
  });

  afterAll(() => {
    process.env.DEBUG = originalDebugValue;
    jest.restoreAllMocks();
  });

  test('Should log if debug flag is enabled', async () => {
    process.env.DEBUG = 'true';

    const { default: debug } = await import('./debug');

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    debug.error('test');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toBe('test');

    consoleSpy.mockRestore();
  });

  test('Should NOT log if debug flag is disabled', async () => {
    process.env.DEBUG = 'false';
    jest.resetModules();

    const { default: debug } = await import('./debug');

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    debug.error('test');

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
