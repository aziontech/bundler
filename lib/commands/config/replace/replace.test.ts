import { jest } from '@jest/globals';
import { replaceInConfigFile } from '.';
import fs from 'fs/promises';
import utils from '../utils';
import * as utilsNode from 'azion/utils/node';

jest.spyOn(fs, 'writeFile').mockImplementation(() => Promise.resolve());
jest.spyOn(utilsNode.feedback, 'info').mockImplementation(() => {});

describe('replace.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockImplementation(() =>
        Promise.resolve({ configPath: 'path/to/config', fileContent: 'module.exports = {}' }),
      );
  });

  it('should replace a simple nested property in config file', async () => {
    const config = `module.exports = {
      applications: {
        name: '$APPLICATION_NAME',
        rules: {
          request: []
        }
      }
    }`;

    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });

    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'my-app'"),
      'utf8',
    );
  });

  it('should replace multiple placeholders in config file', async () => {
    const config = `module.exports = {
      applications: {
        name: '$APPLICATION_NAME',
        rules: {
          request: []
        }
      },
      workloads: [
        {
          name: '$WORKLOAD_NAME',
          deployments: [
            {
              name: '$DEPLOYMENT_NAME',
              current: true,
              active: true,
              strategy: {
                type: 'default',
                attributes: { application: '$APPLICATION_NAME' }
              }
            ]
          }
        ]
      }`;

    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });

    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'my-app'") && expect.stringContaining("application: 'my-app'"),
      'utf8',
    );
  });

  it('should replace a placeholder with export default', async () => {
    const config = `export default { applications: { name: '$APPLICATION_NAME' } }`;

    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });

    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'my-app'"),
      'utf8',
    );
  });

  it('should replace a placeholder with module.exports and defineConfig', async () => {
    const config = `const { defineConfig } = require('azion');
    module.exports = defineConfig({ applications: { name: '$APPLICATION_NAME' } })`;

    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });

    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'my-app'") &&
        expect.stringContaining("const { defineConfig } = require('azion')"),
      'utf8',
    );
  });

  it('should replace a placeholder with import and defineConfig', async () => {
    const config = `import { defineConfig } from 'azion';
    export default defineConfig({ applications: { name: '$APPLICATION_NAME' } })`;

    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });

    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: 'my-app'"),
      'utf8',
    );
  });

  it('should return config content when placeholder is not found', async () => {
    const config = 'module.exports = { applications: { name: "$APPLICATION_NAME_NOT_FOUND" } }';
    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });
    await replaceInConfigFile('$APPLICATION_NAME', 'my-app');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("name: '$APPLICATION_NAME_NOT_FOUND'"),
      'utf8',
    );
  });

  it('should replace a value in property', async () => {
    const config =
      'module.exports = { storage: { bucket: "bucket-name", prefix: "2082382372873" } }';
    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });
    await replaceInConfigFile('2082382372873', 'new-prefix');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("prefix: 'new-prefix'"),
      'utf8',
    );
  });

  it('should replace a value in property with export default and defineConfig', async () => {
    const config = `
        import { defineConfig } from "azion";

        export default defineConfig({
        build: { preset: "javascript", polyfills: true },
        functions: [{ name: "$FUNCTION_NAME", path: "./functions/index.js" }],
        storage: [
            {
            name: "next-commerce-test9",
            prefix: "20250923115113",
            dir: "./.edge/assets",
            workloadsAccess: "read_write",
            },
        ]
        });
    `;
    jest
      .spyOn(utils, 'findAndReadConfigFile')
      .mockResolvedValue({ configPath: 'path/to/config', fileContent: config });
    await replaceInConfigFile('20250923115113', 'new-prefix');
    expect(fs.writeFile).toHaveBeenCalledWith(
      'path/to/config',
      expect.stringContaining("prefix: 'new-prefix'"),
      'utf8',
    );
  });
});
