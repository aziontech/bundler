/* eslint-disable @typescript-eslint/no-explicit-any */
import { AzionConfig } from 'azion/config';
import { createConfig, readConfig, deleteConfig } from './config';

describe('Config Functions', () => {
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
