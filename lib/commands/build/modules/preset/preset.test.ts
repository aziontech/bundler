import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { resolvePreset } from './preset';
import inferPreset from './infer/infer-preset';
import { AzionBuildPreset } from 'azion/config';
import * as utilsNode from 'azion/utils/node';

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

    expect(result).toEqual(
      expect.objectContaining({
        metadata: { name: 'javascript', ext: 'js' },
      }),
    );
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
    const spyInfer = jest
      .spyOn(inferPreset, 'inferPreset')
      .mockResolvedValue('typescript');
    const spyFeedback = jest
      .spyOn(utilsNode.feedback.build, 'info')
      .mockReturnValue(undefined);

    await resolvePreset();

    expect(spyInfer).toHaveBeenCalled();
    expect(spyFeedback).toHaveBeenCalledWith(
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
