import mockFs from 'mock-fs';
import {
  validateSupport,
  validationSupportAndRetrieveFromVcConfig,
} from './support.js';

describe('validateSupport', () => {
  it('should validate support for given version and runtimes', () => {
    const result = validateSupport('12.3.1', ['node', 'edge']);
    expect(result).toEqual({
      valid: true,
      version: '12.3.1',
      runtimes: ['node', 'edge'],
      minorVersion: '12.3.x',
    });
  });

  it('should invalidate unsupported version and runtimes', () => {
    const result = validateSupport('13.0.0', ['node']);
    expect(result).toEqual({
      valid: false,
      version: '13.0.0',
      runtimes: ['node'],
      minorVersion: '13.0.x',
    });
  });
});

describe('validationSupportAndRetrieveFromVcConfig', () => {
  // Mock the file system
  beforeEach(() => {
    mockFs({
      '.vercel/output/functions/': {
        '**': {
          '.vc-config.json': JSON.stringify({
            runtime: 'nodejs18.x',
            framework: {
              version: '12.3.1',
            },
          }),
        },
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should validate and retrieve from vc config', async () => {
    const result = await validationSupportAndRetrieveFromVcConfig();
    expect(result).toEqual({
      vcConfigObjects: expect.any(Array),
      valid: true,
      version: '12.3.1',
      runtimes: ['node'],
      minorVersion: '12.3.x',
    });
  });
});
