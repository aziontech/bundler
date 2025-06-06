import { createConfig, updateConfig, readConfig, deleteConfig } from './config';
import type { AzionConfig, AzionBuild, AzionEdgeApplication, AzionRequestRule } from 'azion/config';

describe('Config CRUD Operations', () => {
  describe('createConfig', () => {
    it('should create a simple property', () => {
      const result = createConfig({
        key: 'build.preset',
        value: 'typescript',
      });

      expect(result).toEqual({
        build: {
          preset: 'typescript',
        },
      });
    });

    it('should create a build configuration', () => {
      const buildConfig: AzionBuild = {
        entry: './src/index.ts',
        bundler: 'webpack',
        preset: 'typescript',
        polyfills: true,
        worker: false,
      };

      const result = createConfig({
        key: 'build',
        value: buildConfig,
      });

      expect(result).toEqual({
        build: buildConfig,
      });
    });

    it('should create an edge application', () => {
      const edgeApp: AzionEdgeApplication = {
        name: 'My Application',
        edgeCacheEnabled: true,
        edgeFunctionsEnabled: true,
        applicationAcceleratorEnabled: true,
        active: true,
      };

      const result = createConfig({
        key: 'edgeApplications[0]',
        value: edgeApp,
      });

      expect(result).toEqual({
        edgeApplications: [edgeApp],
      });
    });

    it('should create a request rule', () => {
      const rule: AzionRequestRule = {
        name: 'My Rule',
        description: 'Test rule',
        active: true,
        behavior: {
          bypassCache: true,
        },
      };

      const result = createConfig({
        key: 'edgeApplications[0].rules.request[0]',
        value: rule,
      });

      expect(result).toEqual({
        edgeApplications: [
          {
            rules: {
              request: [rule],
            },
          },
        ],
      });
    });
  });

  describe('updateConfig', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: './src/index.ts',
        bundler: 'webpack',
        preset: 'javascript',
        polyfills: true,
        worker: false,
      },
      edgeApplications: [
        {
          name: 'Old App',
          edgeCacheEnabled: true,
          rules: {
            request: [
              { name: 'Rule 1', behavior: { bypassCache: true } },
              { name: 'Rule 2', behavior: { bypassCache: false } },
            ],
          },
        },
      ],
    };

    it('should update a build property', () => {
      const result = updateConfig({
        key: 'build.preset',
        value: 'typescript',
        config: baseConfig,
      });

      expect(result.build?.preset).toBe('typescript');
    });

    it('should update an edge application property', () => {
      const result = updateConfig({
        key: 'edgeApplications[0].name',
        value: 'New App',
        config: baseConfig,
      });

      expect(result.edgeApplications?.[0].name).toBe('New App');
    });

    it('should update a request rule', () => {
      const result = updateConfig({
        key: 'edgeApplications[0].rules.request[1].name',
        value: 'New Rule',
        config: baseConfig,
      });

      expect(result.edgeApplications?.[0].rules?.request?.[1].name).toBe('New Rule');
    });

    it('should update entire array element', () => {
      const newApp = {
        name: 'New App',
        edgeCacheEnabled: false,
        rules: {
          request: [{ name: 'New Rule', behavior: { bypassCache: true } }],
        },
      };

      const result = updateConfig({
        key: 'edgeApplications[0]',
        value: newApp,
        config: baseConfig,
      });

      expect(result.edgeApplications?.[0]).toEqual(newApp);
    });

    it('should update nested array element', () => {
      const newRule = {
        name: 'New Rule',
        behavior: { bypassCache: true },
      };

      const result = updateConfig({
        key: 'edgeApplications[0].rules.request[0]',
        value: newRule,
        config: baseConfig,
      });

      expect(result.edgeApplications?.[0].rules?.request?.[0]).toEqual(newRule);
    });

    it('should throw error if property does not exist', () => {
      expect(() => {
        updateConfig({
          key: 'nonexistent.property',
          value: 'value',
          config: baseConfig,
        });
      }).toThrow("Property 'nonexistent' does not exist");
    });

    it('should throw error if array index does not exist', () => {
      expect(() => {
        updateConfig({
          key: 'edgeApplications[1].name',
          value: 'New App',
          config: baseConfig,
        });
      }).toThrow("Array index 1 does not exist in 'edgeApplications'");
    });

    it('should throw error if property is not an array', () => {
      expect(() => {
        updateConfig({
          key: 'build.preset[0]',
          value: 'value',
          config: baseConfig,
        });
      }).toThrow("Property 'preset' is not an array");
    });

    it('should throw error if trying to access array index on non-array', () => {
      expect(() => {
        updateConfig({
          key: 'build[0]',
          value: 'value',
          config: baseConfig,
        });
      }).toThrow("Property 'build' is not an array");
    });

    it('should throw error if array index is out of bounds', () => {
      expect(() => {
        updateConfig({
          key: 'edgeApplications[0].rules.request[2]',
          value: { name: 'New Rule' },
          config: baseConfig,
        });
      }).toThrow("Array index 2 does not exist in 'request'");
    });

    it('should throw error if value is not provided', () => {
      expect(() => {
        updateConfig({
          key: 'build.preset',
          config: baseConfig,
        });
      }).toThrow('Value is required for update');
    });
  });

  describe('readConfig', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: './src/index.ts',
        bundler: 'webpack',
        preset: 'typescript',
        polyfills: true,
        worker: false,
      },
      edgeApplications: [
        {
          name: 'My App',
          edgeCacheEnabled: true,
          rules: {
            request: [
              { name: 'Rule 1', behavior: { bypassCache: true } },
              { name: 'Rule 2', behavior: { bypassCache: false } },
            ],
          },
        },
      ],
    };

    it('should read a build property', () => {
      const result = readConfig({
        key: 'build.preset',
        config: baseConfig,
      });

      expect(result).toBe('typescript');
    });

    it('should read an edge application property', () => {
      const result = readConfig({
        key: 'edgeApplications[0].name',
        config: baseConfig,
      });

      expect(result).toBe('My App');
    });

    it('should read a request rule', () => {
      const result = readConfig({
        key: 'edgeApplications[0].rules.request[1].name',
        config: baseConfig,
      });

      expect(result).toBe('Rule 2');
    });

    it('should read entire array element', () => {
      const result = readConfig({
        key: 'edgeApplications[0]',
        config: baseConfig,
      });

      expect(result).toEqual({
        name: 'My App',
        edgeCacheEnabled: true,
        rules: {
          request: [
            { name: 'Rule 1', behavior: { bypassCache: true } },
            { name: 'Rule 2', behavior: { bypassCache: false } },
          ],
        },
      });
    });

    it('should read nested array element', () => {
      const result = readConfig({
        key: 'edgeApplications[0].rules.request[0]',
        config: baseConfig,
      });

      expect(result).toEqual({
        name: 'Rule 1',
        behavior: { bypassCache: true },
      });
    });

    it('should throw error if property does not exist', () => {
      expect(() => {
        readConfig({
          key: 'nonexistent.property',
          config: baseConfig,
        });
      }).toThrow("Property 'nonexistent' does not exist");
    });

    it('should throw error if array index does not exist', () => {
      expect(() => {
        readConfig({
          key: 'edgeApplications[1].name',
          config: baseConfig,
        });
      }).toThrow("Array index 1 does not exist in 'edgeApplications'");
    });

    it('should throw error if property is not an array', () => {
      expect(() => {
        readConfig({
          key: 'build.preset[0]',
          config: baseConfig,
        });
      }).toThrow("Property 'preset' is not an array");
    });

    it('should throw error if trying to access array index on non-array', () => {
      expect(() => {
        readConfig({
          key: 'build[0]',
          config: baseConfig,
        });
      }).toThrow("Property 'build' is not an array");
    });

    it('should throw error if array index is out of bounds', () => {
      expect(() => {
        readConfig({
          key: 'edgeApplications[0].rules.request[2]',
          config: baseConfig,
        });
      }).toThrow("Array index 2 does not exist in 'request'");
    });
  });

  describe('deleteConfig', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: './src/index.ts',
        bundler: 'webpack',
        preset: 'typescript',
        polyfills: true,
        worker: false,
      },
      edgeApplications: [
        {
          name: 'My App',
          edgeCacheEnabled: true,
          rules: {
            request: [
              { name: 'Rule 1', behavior: { bypassCache: true } },
              { name: 'Rule 2', behavior: { bypassCache: false } },
            ],
          },
        },
      ],
    };

    it('should delete a build property', () => {
      const result = deleteConfig({
        key: 'build.preset',
        config: baseConfig,
      });

      expect(result.build?.preset).toBeUndefined();
    });

    it('should delete a request rule', () => {
      const result = deleteConfig({
        key: 'edgeApplications[0].rules.request[1]',
        config: baseConfig,
      });

      expect(result.edgeApplications?.[0].rules?.request).toHaveLength(1);
      expect(result.edgeApplications?.[0].rules?.request?.[0].name).toBe('Rule 1');
    });

    it('should delete an edge application', () => {
      const result = deleteConfig({
        key: 'edgeApplications[0]',
        config: baseConfig,
      });

      expect(result.edgeApplications).toHaveLength(0);
    });

    it('should throw error if property does not exist', () => {
      expect(() => {
        deleteConfig({
          key: 'nonexistent.property',
          config: baseConfig,
        });
      }).toThrow("Property 'nonexistent' does not exist");
    });

    it('should throw error if array index does not exist', () => {
      expect(() => {
        deleteConfig({
          key: 'edgeApplications[1]',
          config: baseConfig,
        });
      }).toThrow("Array index 1 does not exist in 'edgeApplications'");
    });
  });
});
