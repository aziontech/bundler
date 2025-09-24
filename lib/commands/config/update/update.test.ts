import { jest } from '@jest/globals';
import fs from 'fs/promises';

import utils from '../utils';
import { updateInConfigFile } from '.';
import * as utilsNode from 'azion/utils/node';

describe('update.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockImplementation(() =>
        Promise.resolve({ configPath: 'path/to/config', fileContent: 'module.exports = {}' }),
      );
    jest.spyOn(fs, 'writeFile').mockImplementation(() => Promise.resolve());
    jest.spyOn(utilsNode.feedback, 'info').mockImplementation(() => {});
  });

  it('should update a simple nested property in config file', async () => {
    const config = `module.exports = { build: { preset: 'javascript' } }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/config',
      fileContent: config,
    });
    await updateInConfigFile('build.preset', 'typescript');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      `module.exports = { build: { preset: 'typescript' } }\n`,
      'utf8',
    );
  });

  it('should update a top-level property in config file', async () => {
    const config = `export default { mode: 'development' }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/azion.config.ts',
      fileContent: config,
    });
    await updateInConfigFile('mode', 'production');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/azion.config.ts',
      `export default { mode: 'production' }\n`,
      'utf8',
    );
  });

  it('should update array property by index', async () => {
    const config = `module.exports = {
    functions: [
      { name: 'old-name', path: './handler.js' }
    ]
  }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/azion.config.js',
      fileContent: config,
    });
    await updateInConfigFile('functions[0].name', 'new-name');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/azion.config.js',
      expect.stringContaining("name: 'new-name'"),
      'utf8',
    );
  });

  it('should replace whole array item', async () => {
    const config = `export default {
      functions: [
        { name: 'old-function', path: './old.js' },
        { name: 'other-function', path: './other.js' }
      ]
    }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/azion.config.ts',
      fileContent: config,
    });
    await updateInConfigFile('functions[0]', '{ name: "new-function", path: "./new.js" }');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/azion.config.ts',
      expect.stringContaining("{ name: 'new-function', path: './new.js' }"),
      'utf8',
    );
  });

  it('should update multiple array items correctly', async () => {
    const config = `module.exports = {
      applications: [
        { name: 'app1' },
        { name: 'app2' }
      ]
    }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/config',
      fileContent: config,
    });
    await updateInConfigFile('applications[1].name', 'app3');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'app3'"),
      'utf8',
    );
  });

  it('should update array items in single-line format', async () => {
    const config = `module.exports = {
      applications: [{ name: 'app1' }, { name: 'app2' }]
    }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/config',
      fileContent: config,
    });

    await updateInConfigFile('applications[1].name', 'app3');

    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'app3'"),
      'utf8',
    );
  });

  it('should debug single line array update', async () => {
    const config = `module.exports = {
      applications: [
        { name: 'app1', rules: { request: [] } },
        { name: 'app2', rules: { request: [] } }
      ]
    }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/config',
      fileContent: config,
    });

    await updateInConfigFile('applications[1].name', 'app3');

    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'app3'"),
      'utf8',
    );
  });

  it('should update deeply nested array properties', async () => {
    const config = `export default {
      applications: [
        {
          rules: {
            request: [
              { 
                name: 'old-name'
              }
            ]
          }
        }
      ]
    }`;
    jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
      configPath: 'path/to/azion.config.ts',
      fileContent: config,
    });

    await updateInConfigFile('applications[0].rules.request[0].name', 'new-name');

    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/azion.config.ts',
      expect.stringContaining("name: 'new-name'"),
      'utf8',
    );
  });

  describe('Value formatting', () => {
    beforeEach(() => {
      const config = `module.exports = { build: { preset: 'javascript' } }`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: 'path/to/config',
        fileContent: config,
      });
    });

    it('should format string values with quotes', async () => {
      await updateInConfigFile('build.preset', 'typescript');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("'typescript'"),
        'utf8',
      );
    });

    it('should format object values without quotes', async () => {
      await updateInConfigFile('build.preset', '{ type: "module" }');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("{ type: 'module' }"),
        'utf8',
      );
    });

    it('should format array values without quotes', async () => {
      await updateInConfigFile('build.preset', '["item1", "item2"]');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("['item1', 'item2']"),
        'utf8',
      );
    });

    it('should format function values without quotes', async () => {
      await updateInConfigFile('build.preset', '(config) => config');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining('(config) => config'),
        'utf8',
      );
    });

    it('should format boolean values without quotes', async () => {
      await updateInConfigFile('build.preset', 'true');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining('true'),
        'utf8',
      );
    });

    it('should preserve already quoted strings', async () => {
      await updateInConfigFile('build.preset', '"already-quoted"');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("'already-quoted'"),
        'utf8',
      );
    });

    it('should handle file paths with quotes', async () => {
      await updateInConfigFile('build.preset', './path/to/file.js');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("'./path/to/file.js'"),
        'utf8',
      );
    });
  });

  describe('Error handling', () => {
    it('should handle config file not found error', async () => {
      jest
        .spyOn(utils, 'findAndReadConfigFile')
        .mockRejectedValue(new Error('No azion config file found'));

      await expect(updateInConfigFile('build.preset', 'typescript')).rejects.toThrow(
        'Failed to update config file: No azion config file found',
      );

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file write error', async () => {
      const config = `module.exports = { build: { preset: 'javascript' } }`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: 'path/to/config',
        fileContent: config,
      });
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Permission denied'));

      await expect(updateInConfigFile('build.preset', 'typescript')).rejects.toThrow(
        'Failed to update config file: Permission denied',
      );
    });

    // it('should handle prettier formatting failure gracefully', async () => {
    //   const config = `module.exports = { build: { preset: 'javascript' } }`;
    //   jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
    //     configPath: 'path/to/config',
    //     fileContent: config,
    //   });

    //   const prettier = await import('prettier');
    //   jest.spyOn(prettier, 'format').mockRejectedValue(new Error('Prettier failed'));
    //   jest.spyOn(fs, 'writeFile').mockResolvedValue();

    //   await updateInConfigFile('build.preset', 'typescript');

    //   // Should still write the file even when prettier fails
    //   expect(fs.writeFile).toHaveBeenCalledWith(
    //     'path/to/config',
    //     expect.stringContaining("'typescript'"),
    //     'utf8',
    //   );
    // });
  });

  describe('Complex scenarios', () => {
    it('should handle config with comments and preserve structure', async () => {
      const config = `// Configuration file
module.exports = {
  // Build settings
  build: {
    preset: 'javascript', // Current preset
    polyfills: true
  }
}`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: 'path/to/config',
        fileContent: config,
      });

      await updateInConfigFile('build.preset', 'typescript');

      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("'typescript'"),
        'utf8',
      );
    });

    it('should handle defineConfig wrapper', async () => {
      const config = `import { defineConfig } from 'azion';

export default defineConfig({
  build: {
    preset: 'javascript'
  }
});`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: 'path/to/azion.config.ts',
        fileContent: config,
      });

      await updateInConfigFile('build.preset', 'typescript');

      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/azion.config.ts',
        expect.stringContaining("'typescript'"),
        'utf8',
      );
    });

    it('should handle multiline object values', async () => {
      const config = `module.exports = {
  build: {
    preset: 'javascript'
  }
}`;
      const multilineObject = `{
  name: 'test-function',
  path: './handler.js',
  runtime: 'nodejs'
}`;

      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: 'path/to/config',
        fileContent: config,
      });

      await updateInConfigFile('build.preset', multilineObject);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'path/to/config',
        expect.stringContaining("name: 'test-function'"),
        'utf8',
      );
    });
  });

  describe('Feedback and logging', () => {
    it('should provide success feedback with correct file name', async () => {
      const config = `module.exports = { build: { preset: 'javascript' } }`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: '/path/to/azion.config.js',
        fileContent: config,
      });

      await updateInConfigFile('build.preset', 'typescript');

      expect(utilsNode.feedback.info).toHaveBeenCalledWith(
        'Successfully updated "build.preset" to "typescript" in azion.config.js',
      );
    });

    it('should provide feedback for different file extensions', async () => {
      const config = `export default { build: { preset: 'javascript' } }`;
      jest.spyOn(utils, 'findAndReadConfigFile').mockResolvedValue({
        configPath: '/path/to/azion.config.ts',
        fileContent: config,
      });

      await updateInConfigFile('build.preset', 'typescript');

      expect(utilsNode.feedback.info).toHaveBeenCalledWith(
        'Successfully updated "build.preset" to "typescript" in azion.config.ts',
      );
    });
  });
});
