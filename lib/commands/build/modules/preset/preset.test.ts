import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { resolvePreset, inferPreset } from './preset';
import { AzionBuildPreset } from 'azion/config';
import { feedback } from 'azion/utils/node';
import { existsSync, readdirSync } from 'fs';
// @ts-expect-error - Types are not properly exported
import { listFrameworks } from '@netlify/framework-info';

// Mock dependencies
jest.mock('azion/utils/node', () => ({
  feedback: {
    build: {
      info: jest.fn(),
    },
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock('@netlify/framework-info', () => ({
  listFrameworks: jest.fn(),
}));

jest.mock('azion/presets', () => ({
  javascript: {
    metadata: { name: 'javascript' },
    config: { build: {} },
  },
  typescript: {
    metadata: { name: 'typescript' },
    config: { build: {} },
  },
  react: {
    metadata: { name: 'react', registry: 'react' },
    config: { build: {} },
  },
}));

describe('resolvePreset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load preset by name', async () => {
    const result = await resolvePreset('javascript');

    expect(result).toEqual({
      metadata: { name: 'javascript' },
      config: { build: {} },
    });
  });

  it('should return preset object when provided directly', async () => {
    const customPreset: AzionBuildPreset = {
      metadata: { name: 'javascript' },
      config: { build: {} },
    };

    const result = await resolvePreset(customPreset);

    expect(result).toBe(customPreset);
  });

  it('should infer preset when none is provided', async () => {
    (inferPreset as jest.Mock) = jest
      .fn()
      .mockImplementation(() => Promise.resolve('typescript'));

    await resolvePreset();

    expect(feedback.build.info).toHaveBeenCalledWith(
      'No preset specified, using automatic detection...',
    );
  });

  it('should throw error for invalid preset', async () => {
    const invalidPreset: AzionBuildPreset = {
      metadata: { name: 'invalid' },
      config: { build: {} },
    };

    await expect(resolvePreset(invalidPreset)).rejects.toThrow(
      "Invalid build preset name: 'invalid'",
    );
  });

  it('should throw error for preset without required properties', async () => {
    const incompletePreset = {
      metadata: { name: 'javascript' },
    } as AzionBuildPreset;

    await expect(resolvePreset(incompletePreset)).rejects.toThrow(
      'Preset must have name and config.',
    );
  });
});

describe('inferPreset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (process.cwd as jest.Mock).mockReturnValue('/mock/project');
  });

  it('should detect framework using @netlify/framework-info', async () => {
    (listFrameworks as jest.Mock).mockImplementation(() => Promise.resolve([]));

    const result = await inferPreset();

    expect(listFrameworks).toHaveBeenCalledWith({
      projectDir: '/mock/project',
    });
    expect(result).toBe('react');
  });

  it('should detect TypeScript from tsconfig.json', async () => {
    (listFrameworks as jest.Mock).mockImplementation(() => Promise.resolve([]));
    (existsSync as jest.Mock).mockReturnValue(true);

    const result = await inferPreset();

    expect(result).toBe('typescript');
  });

  it('should detect TypeScript from .ts files', async () => {
    (listFrameworks as jest.Mock).mockImplementation(() => Promise.resolve([]));
    (existsSync as jest.Mock).mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValue(['index.ts', 'app.js']);

    const result = await inferPreset();

    expect(result).toBe('typescript');
  });

  it('should default to JavaScript when no specific technology is detected', async () => {
    (listFrameworks as jest.Mock).mockImplementation(() => Promise.resolve([]));
    (existsSync as jest.Mock).mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValue(['index.js', 'app.js']);

    const result = await inferPreset();

    expect(result).toBe('javascript');
  });

  it('should default to JavaScript on error', async () => {
    (listFrameworks as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Test error')),
    );

    const result = await inferPreset();

    expect(result).toBe('javascript');
  });
});
