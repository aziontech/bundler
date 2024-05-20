import mockFs from 'mock-fs';
import {
  validateSupport,
  validationSupportAndRetrieveFromVcConfig,
} from './support.js';

jest.mock('./supported-versions.js', () => ({
  __esModule: true,
  default: new Map([
    ['nextjs-12.3.x', ['node', 'edge']],
    ['nextjs-13.0.x', ['edge']],
    ['nextjs-13.1.x', ['edge']],
    ['nextjs-13.2.x', ['edge']],
    ['nextjs-13.2.2', ['edge']],
    ['nextjs-14.1.1', ['edge']],
  ]),
}));

describe('validateSupport', () => {
  it('should validate support for given version and runtimes', () => {
    const result = validateSupport('12.3.1', ['node', 'edge']);
    expect(result).toEqual({
      valid: true,
      version: '12.3.1',
      runtimes: ['node', 'edge'],
      minorVersion: '12.3.x',
      allowedRuntimes: ['node', 'edge'],
    });
  });

  it('should validate support for given version and runtimes are supported', () => {
    const result = validateSupport('13.0.0', ['edge']);
    expect(result).toEqual({
      valid: true,
      version: '13.0.0',
      runtimes: ['edge'],
      minorVersion: '13.0.x',
      allowedRuntimes: ['edge'],
    });
  });

  it('should invalidate the runtime (node) not supported for edge runtime of this version which is edge only', () => {
    const result = validateSupport('13.1.1', ['node', 'edge']);
    expect(result).toEqual({
      valid: false,
      version: '13.1.1',
      runtimes: ['node', 'edge'],
      minorVersion: '13.1.x',
      allowedRuntimes: ['edge'],
    });
  });

  it('should validate supported path version and runtime', () => {
    const result = validateSupport('14.1.1', ['edge']);
    expect(result).toEqual({
      valid: true,
      version: '14.1.1',
      runtimes: ['edge'],
      minorVersion: '14.1.x',
      allowedRuntimes: ['edge'],
    });
  });

  it('should invalidate unsupported version and runtimes', () => {
    const result = validateSupport('14.0.0', ['edge']);
    expect(result).toEqual({
      valid: false,
      version: '14.0.0',
      runtimes: ['edge'],
      minorVersion: '14.0.x',
      allowedRuntimes: [],
    });
  });

  it('should prioritize version path if specific support is available', () => {
    const result = validateSupport('13.2.2', ['edge']);
    expect(result).toEqual({
      valid: true,
      version: '13.2.2',
      runtimes: ['edge'],
      minorVersion: '13.2.x',
      allowedRuntimes: ['edge'],
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
      allowedRuntimes: ['node', 'edge'],
      invalidFunctions: [
        { runtime: 'nodejs18.x', function: '**/.vc-config.json' },
      ],
    });
  });
});
