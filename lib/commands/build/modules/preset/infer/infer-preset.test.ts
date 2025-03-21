import { jest } from '@jest/globals';
import inferPreset from './infer-preset';
import fs from 'fs';
import frameworks from '../frameworks';

describe('inferPreset', () => {
  let spyListFrameworks: jest.SpiedFunction<typeof frameworks.listFrameworks>;

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue('./');
    spyListFrameworks = jest.spyOn(frameworks, 'listFrameworks');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should detect framework using @netlify/framework-info', async () => {
    spyListFrameworks.mockResolvedValue([{ id: 'react' }]);

    const result = await inferPreset.inferPreset();

    expect(spyListFrameworks).toHaveBeenCalledWith({
      projectDir: './',
    });
    expect(result).toBe('react');
  });

  it('should detect TypeScript from tsconfig.json', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const result = await inferPreset.inferPreset();

    expect(result).toBe('typescript');
  });

  it('should detect TypeScript from .ts files', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest
      .spyOn(fs, 'readdirSync')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue(['index.ts', 'app.ts'] as any);

    const result = await inferPreset.inferPreset();

    expect(result).toBe('typescript');
  });

  it('should default to JavaScript when no specific technology is detected', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest
      .spyOn(fs, 'readdirSync')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue(['index.js', 'app.js'] as any);

    const result = await inferPreset.inferPreset();

    expect(result).toBe('javascript');
  });

  it('should default to JavaScript on error', async () => {
    jest
      .spyOn(frameworks, 'listFrameworks')
      .mockRejectedValue(new Error('Test error'));

    const result = await inferPreset.inferPreset();

    expect(result).toBe('javascript');
  });
});
