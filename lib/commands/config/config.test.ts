/* eslint-disable @typescript-eslint/no-explicit-any */
import { AzionConfig } from 'azion/config';
import { replaceConfig, createConfig, updateConfig, readConfig, deleteConfig } from './config';

describe('Config Functions', () => {
  describe('replaceConfig', () => {
    it('should replace simple string placeholders', () => {
      const config: AzionConfig = {
        build: {
          preset: '$PRESET_NAME',
        },
      };

      const result = replaceConfig({
        placeholder: '$PRESET_NAME',
        value: 'typescript',
        config,
      });

      expect(result.build?.preset).toBe('typescript');
    });

    it('should replace placeholders in nested objects', () => {
      const config: any = {
        applications: [
          {
            name: '$APP_NAME',
            rules: {
              request: [
                {
                  name: '$RULE_NAME',
                },
              ],
            },
          },
        ],
      };

      const result = replaceConfig({
        placeholder: '$APP_NAME',
        value: 'my-app',
        config,
      });

      expect(result.applications?.[0]?.name).toBe('my-app');
      expect(result.applications?.[0]?.rules?.request?.[0]?.name).toBe('$RULE_NAME');
    });

    it('should replace multiple occurrences of the same placeholder', () => {
      const config: any = {
        storage: [
          {
            name: '$BUCKET_NAME',
            bucket: '$BUCKET_NAME',
          },
        ],
        connectors: [
          {
            name: '$BUCKET_NAME',
          },
        ],
      };

      const result = replaceConfig({
        placeholder: '$BUCKET_NAME',
        value: 'my-bucket',
        config,
      });

      expect(result.storage?.[0]?.name).toBe('my-bucket');
      expect(result.storage?.[0]?.name).toBe('my-bucket');
      expect(result.connectors?.[0]?.name).toBe('my-bucket');
    });

    it('should replace placeholders in arrays', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: '$APP_NAME',
            functionsInstances: [
              {
                name: '$FUNCTION_NAME',
                ref: '$FUNCTION_REF',
              },
            ],
          },
        ],
      };

      const result = replaceConfig({
        placeholder: '$FUNCTION_NAME',
        value: 'my-function',
        config,
      });

      expect(result.applications?.[0]?.name).toBe('$APP_NAME');
      expect(result.applications?.[0]?.functionsInstances?.[0]?.name).toBe('my-function');
    });

    it('should preserve functions and not replace inside them', () => {
      const testFunction = (config: any) => {
        config.keepNames = false;
        return config;
      };

      const config: AzionConfig = {
        build: {
          extend: testFunction,
          preset: '$PRESET_NAME',
        },
      };

      const result = replaceConfig({
        placeholder: '$PRESET_NAME',
        value: 'typescript',
        config,
      });

      expect(result.build?.extend).toBe(testFunction);
      expect(result.build?.preset).toBe('typescript');
    });

    it('should handle exact string matching for placeholders', () => {
      const config: any = {
        build: {
          preset: '$PRESET_NAME',
        },
      };

      const result = replaceConfig({
        placeholder: '$PRESET_NAME',
        value: 'typescript',
        config,
      });

      expect(result.build?.preset).toBe('typescript');
    });

    it('should handle empty config', () => {
      const config: AzionConfig = {};

      const result = replaceConfig({
        placeholder: '$PLACEHOLDER',
        value: 'value',
        config,
      });

      expect(result).toEqual({});
    });

    it('should replace placeholders when config contains functions', () => {
      const config: AzionConfig = {
        build: {
          preset: '$PRESET_NAME',
          extend: (config: any) => {
            config.minify = true;
            return config;
          },
        },
      };

      const result = replaceConfig({ placeholder: '$PRESET_NAME', value: 'typescript', config });
      expect(result.build?.extend).toBeInstanceOf(Function);
      expect(result.build?.preset).toBe('typescript');
    });
  });

  describe('createConfig', () => {
    it('should create simple property', () => {
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

    it('should create nested properties', () => {
      const result = createConfig({
        key: 'build.commands.dev',
        value: 'npm run dev',
      });

      expect(result).toEqual({
        build: {
          commands: {
            dev: 'npm run dev',
          },
        },
      });
    });

    it('should create array element', () => {
      const result = createConfig({
        key: 'applications[0].name',
        value: 'My Application',
      });

      expect(result).toEqual({
        applications: [
          {
            name: 'My Application',
          },
        ],
      });
    });

    it('should create nested array element', () => {
      const result = createConfig({
        key: 'applications[0].rules.request[1].name',
        value: 'My Rule',
      });

      expect(result).toEqual({
        applications: [
          {
            rules: {
              request: [undefined, { name: 'My Rule' }],
            },
          },
        ],
      });
    });

    it('should parse JSON values', () => {
      const result = createConfig({
        key: 'build.config',
        value: '{"minify": true, "sourcemap": false}',
      });

      expect(result).toEqual({
        build: {
          config: {
            minify: true,
            sourcemap: false,
          },
        },
      });
    });

    it('should parse array JSON values', () => {
      const result = createConfig({
        key: 'build.targets',
        value: '["es2020", "node16"]',
      });

      expect(result).toEqual({
        build: {
          targets: ['es2020', 'node16'],
        },
      });
    });

    it('should handle non-JSON string values', () => {
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

    it('should handle number values', () => {
      const result = createConfig({
        key: 'build.port',
        value: 3000,
      });

      expect(result).toEqual({
        build: {
          port: 3000,
        },
      });
    });

    it('should handle boolean values', () => {
      const result = createConfig({
        key: 'build.minify',
        value: true,
      });

      expect(result).toEqual({
        build: {
          minify: true,
        },
      });
    });
  });

  describe('updateConfig', () => {
    it('should update existing simple property', () => {
      const config: AzionConfig = {
        build: {
          preset: 'javascript',
        },
      };

      const result = updateConfig({
        key: 'build.preset',
        value: 'typescript',
        config,
      });

      expect(result).toEqual({
        build: {
          preset: 'typescript',
        },
      });
    });

    it('should update existing nested property', () => {
      const config: any = {
        build: {
          commands: {
            dev: 'npm start',
          },
        },
      };

      const result = updateConfig({
        key: 'build.commands.dev',
        value: 'npm run dev',
        config,
      });

      expect(result).toEqual({
        build: {
          commands: {
            dev: 'npm run dev',
          },
        },
      });
    });

    it('should update existing array element', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: 'Old Name',
          },
        ],
      };

      const result = updateConfig({
        key: 'applications[0].name',
        value: 'New Name',
        config,
      });

      expect(result).toEqual({
        applications: [
          {
            name: 'New Name',
          },
        ],
      });
    });

    it('should create new property if it does not exist', () => {
      const config: AzionConfig = {
        build: {},
      };

      const result = updateConfig({
        key: 'build.preset',
        value: 'typescript',
        config,
      });

      expect(result).toEqual({
        build: {
          preset: 'typescript',
        },
      });
    });

    it('should extend array if index does not exist', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: 'App 1',
          },
        ],
      };

      const result = updateConfig({
        key: 'applications[2].name',
        value: 'App 3',
        config,
      });

      expect(result.applications).toHaveLength(3);
      expect(result.applications?.[0]?.name).toBe('App 1');
      expect(result.applications?.[1]).toEqual({});
      expect(result.applications?.[2]?.name).toBe('App 3');
    });

    it('should throw error if config is not provided', () => {
      expect(() => {
        updateConfig({
          key: 'build.preset',
          value: 'typescript',
        });
      }).toThrow('Config is required for update');
    });

    it('should throw error if value is not provided', () => {
      expect(() => {
        updateConfig({
          key: 'build.preset',
          config: {},
        });
      }).toThrow('Value is required for update');
    });

    it('should throw error when trying to set array index on non-array', () => {
      const config: any = {
        build: {
          preset: 'typescript',
        },
      };

      expect(() => {
        updateConfig({
          key: 'build.preset[0]',
          value: 'value',
          config,
        });
      }).toThrow("Property 'preset' is not an array but trying to access array index");
    });

    it('should throw error when property is not array but trying to access array index', () => {
      const config: any = {
        build: {
          preset: 'typescript',
        },
      };

      expect(() => {
        updateConfig({
          key: 'build.preset[0].name',
          value: 'value',
          config,
        });
      }).toThrow("Property 'preset' is not an array but trying to access array index");
    });
  });

  describe('readConfig', () => {
    const sampleConfig: any = {
      build: {
        preset: 'typescript',
        commands: {
          dev: 'npm run dev',
        },
      },
      applications: [
        {
          name: 'App 1',
          rules: {
            request: [
              {
                name: 'Rule 1',
              },
            ],
          },
        },
        {
          name: 'App 2',
        },
      ],
    };

    it('should read simple property', () => {
      const result = readConfig({
        key: 'build.preset',
        config: sampleConfig,
      });

      expect(result).toBe('typescript');
    });

    it('should read nested property', () => {
      const result = readConfig({
        key: 'build.commands.dev',
        config: sampleConfig,
      });

      expect(result).toBe('npm run dev');
    });

    it('should read array element', () => {
      const result = readConfig({
        key: 'applications[0].name',
        config: sampleConfig,
      });

      expect(result).toBe('App 1');
    });

    it('should read nested array element', () => {
      const result = readConfig({
        key: 'applications[0].rules.request[0].name',
        config: sampleConfig,
      });

      expect(result).toBe('Rule 1');
    });

    it('should read entire object', () => {
      const result = readConfig({
        key: 'build.commands',
        config: sampleConfig,
      });

      expect(result).toEqual({
        dev: 'npm run dev',
      });
    });

    it('should throw error if config is not provided', () => {
      expect(() => {
        readConfig({
          key: 'build.preset',
        });
      }).toThrow('Config is required for read');
    });

    it('should throw error if property does not exist', () => {
      expect(() => {
        readConfig({
          key: 'build.nonexistent',
          config: sampleConfig,
        });
      }).toThrow("Property 'nonexistent' does not exist");
    });

    it('should throw error if array index does not exist', () => {
      expect(() => {
        readConfig({
          key: 'applications[5].name',
          config: sampleConfig,
        });
      }).toThrow('Array index 5 does not exist');
    });

    it('should throw error if property is not an array', () => {
      expect(() => {
        readConfig({
          key: 'build.preset[0]',
          config: sampleConfig,
        });
      }).toThrow("Property 'preset' is not an array");
    });

    it('should throw error if property is not an array but trying to access array index', () => {
      expect(() => {
        readConfig({
          key: 'build.preset[0].name',
          config: sampleConfig,
        });
      }).toThrow("Property 'preset' is not an array");
    });

    it('should throw error if array index does not exist in nested property', () => {
      expect(() => {
        readConfig({
          key: 'applications[0].rules.request[5].name',
          config: sampleConfig,
        });
      }).toThrow("Array index 5 does not exist in 'request'");
    });
  });

  describe('deleteConfig', () => {
    it('should delete simple property', () => {
      const config: any = {
        build: {
          preset: 'typescript',
          minify: true,
        },
      };

      const result = deleteConfig({
        key: 'build.preset',
        config,
      });

      expect(result).toEqual({
        build: {
          minify: true,
        },
      });
    });

    it('should delete nested property', () => {
      const config: any = {
        build: {
          commands: {
            dev: 'npm run dev',
            build: 'npm run build',
          },
        },
      };

      const result = deleteConfig({
        key: 'build.commands.dev',
        config,
      });

      expect(result).toEqual({
        build: {
          commands: {
            build: 'npm run build',
          },
        },
      });
    });

    it('should delete array element', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: 'App 1',
          },
          {
            name: 'App 2',
          },
          {
            name: 'App 3',
          },
        ],
      };

      const result = deleteConfig({
        key: 'applications[1]',
        config,
      });

      expect(result.applications).toHaveLength(2);
      expect(result.applications?.[0]?.name).toBe('App 1');
      expect(result.applications?.[1]?.name).toBe('App 3');
    });

    it('should delete property from array element', () => {
      const config: any = {
        applications: [
          {
            name: 'App 1',
            description: 'Description 1',
          },
        ],
      };

      const result = deleteConfig({
        key: 'applications[0].description',
        config,
      });

      expect(result).toEqual({
        applications: [
          {
            name: 'App 1',
          },
        ],
      });
    });

    it('should throw error if config is not provided', () => {
      expect(() => {
        deleteConfig({
          key: 'build.preset',
        });
      }).toThrow('Config is required for delete');
    });

    it('should throw error if property does not exist', () => {
      const config: any = {
        build: {
          preset: 'typescript',
        },
      };

      expect(() => {
        deleteConfig({
          key: 'build.nonexistent',
          config,
        });
      }).toThrow("Property 'nonexistent' does not exist");
    });

    it('should throw error if array property does not exist', () => {
      const config: any = {
        build: {
          preset: 'typescript',
        },
      };

      expect(() => {
        deleteConfig({
          key: 'applications[0]',
          config,
        });
      }).toThrow("Property 'applications' does not exist");
    });

    it('should throw error if property is not an array', () => {
      const config: any = {
        build: {
          preset: 'typescript',
        },
      };

      expect(() => {
        deleteConfig({
          key: 'build.preset[0]',
          config,
        });
      }).toThrow("Property 'preset' is not an array");
    });

    it('should throw error if array index does not exist', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: 'App 1',
          },
        ],
      };

      expect(() => {
        deleteConfig({
          key: 'applications[5]',
          config,
        });
      }).toThrow("Array index 5 does not exist in 'applications'");
    });

    it('should throw error if trying to delete from non-existent nested property', () => {
      const config: AzionConfig = {
        applications: [
          {
            name: 'App 1',
          },
        ],
      };

      expect(() => {
        deleteConfig({
          key: 'applications[0].rules.request[0].name',
          config,
        });
      }).toThrow("Property 'rules' does not exist");
    });
  });
});
