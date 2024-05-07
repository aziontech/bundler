import { describe, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import mockFs from 'mock-fs';
import {
  generateManifest,
  processManifestConfig,
} from './generateManifest.utils.js';

describe('Utils - generateManifest', () => {
  it('should correctly merge config when generateManifest is called multiple times', async () => {
    globalThis.vulcan = {};
    const presetConfig = {
      rules: {
        request: [
          {
            name: 'Main_Rule',
            match: '^\\/',
            runFunction: {
              path: '.edge/worker.js',
            },
          },
        ],
      },
    };
    const azionConfig = {
      origin: [
        {
          name: 'my origin storage',
          type: 'object_storage',
          bucket: 'mybucket',
          prefix: 'myfolder',
        },
      ],
      rules: {
        request: [
          {
            name: 'my-rule-origin',
            match: '/^/_statics/;',
            setOrigin: {
              name: 'my origin storage',
              type: 'object_storage',
            },
          },
        ],
      },
    };
    mockFs({
      '.edge/manifest.json': '{}',
    });
    await generateManifest(presetConfig);
    await generateManifest(azionConfig, true);
    const manifest = readFileSync('.edge/manifest.json', 'utf8');
    mockFs.restore();
    expect(JSON.parse(manifest)).toEqual(
      expect.objectContaining({
        origin: expect.arrayContaining([
          {
            name: 'my origin storage',
            origin_type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ]),
        rules: expect.arrayContaining([
          {
            name: 'my-rule-origin',
            criteria: [
              [
                {
                  // eslint-disable-next-line no-template-curly-in-string
                  variable: '${uri}',
                  operator: 'matches',
                  conditional: 'if',
                  input_value: '/^/_statics/;',
                },
              ],
            ],
            behaviors: [
              {
                name: 'set_origin',
                target: 'my origin storage',
              },
            ],
          },
          {
            name: 'Main_Rule',
            criteria: [
              [
                {
                  // eslint-disable-next-line no-template-curly-in-string
                  variable: '${uri}',
                  operator: 'matches',
                  conditional: 'if',
                  input_value: '^\\/',
                },
              ],
            ],
            behaviors: [
              {
                name: 'run_function',
                target: '.edge/worker.js',
              },
            ],
          },
        ]),
        cache: [],
      }),
    );
  });

  describe('processManifestConfig', () => {
    it('should throw an error for invalid mathematical expressions', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            browser: { maxAgeSeconds: '2 * 3' },
            edge: { maxAgeSeconds: 'invalidExpression' },
          },
        ],
        rules: {
          request: [],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "The 'maxAgeSeconds' field must be a number or a valid mathematical expression.",
      );
    });

    it('should process a cache object directly in the rule', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/test',
              cache: {
                name: 'directCache',
                browser_cache_settings_maximum_ttl: 300,
                cdn_cache_settings_maximum_ttl: 600,
              },
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result).toHaveProperty('cache');
      expect(result.cache).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'directCache' }),
        ]),
      );
    });

    it('should handle rewrites with dynamic parameter names correctly', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/test',
              rewrite: {
                match: '^(./)([^/])$',
                set: (other) => `/${other[0]}/${other[1]}`,
              },
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'capture_match_groups',
            target: expect.objectContaining({
              captured_array: 'other',
              regex: '^(./)([^/])$',
              // eslint-disable-next-line no-template-curly-in-string
              subject: '${uri}',
            }),
          }),
          expect.objectContaining({
            name: 'rewrite_request',
            // eslint-disable-next-line no-template-curly-in-string
            target: '/${other[0]}/${other[1]}',
          }),
        ]),
      );
    });

    it('should correctly calculate numerical values', () => {
      const azionConfig = {
        cache: [
          {
            name: 'calcCache',
            browser: { maxAgeSeconds: '2 * 3' },
            edge: { maxAgeSeconds: '4 + 1' },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          browser_cache_settings_maximum_ttl: 6,
          cdn_cache_settings_maximum_ttl: 5,
        }),
      );
    });

    it('should correctly handle the absence of cache settings', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/no-cache',
              runFunction: {
                path: '.edge/worker.js',
              },
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.cache).toEqual([]);
    });

    it('should correctly convert request rules', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my origin storage',
                type: 'object_storage',
              },
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            criteria: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  input_value: '/api',
                }),
              ]),
            ]),
            behaviors: expect.arrayContaining([
              expect.objectContaining({
                name: 'set_origin',
                target: 'my origin storage',
              }),
            ]),
          }),
        ]),
      );
    });

    it('should correctly calculate complex mathematical expressions', () => {
      const azionConfig = {
        cache: [
          {
            name: 'complexMathCache',
            browser: { maxAgeSeconds: '(2 * 3) + 5' },
            edge: { maxAgeSeconds: '10 / 2' },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          browser_cache_settings_maximum_ttl: 11,
          cdn_cache_settings_maximum_ttl: 5,
        }),
      );
    });

    it('should throw an error when data types do not match the expected', () => {
      const azionConfig = {
        cache: [
          {
            name: 'typeValidationCache',
            browser: { maxAgeSeconds: true }, // Invalid boolean type for maxAgeSeconds
            edge: { maxAgeSeconds: '10' },
          },
        ],
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "The 'maxAgeSeconds' field must be a number or a valid mathematical expression.",
      );
    });

    it('should correctly configure cookie forwarding when forwardCookies is true', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              forwardCookies: true,
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      // Checks if the forward_cookies behavior is included and set to true when forwardCookies is true
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'forward_cookies',
            target: null, // Updated from 'params' to 'target'
          }),
        ]),
      );
    });

    it('should not include forward_cookies behavior when forwardCookies is false or not specified', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/no-forward',
              forwardCookies: false,
            },
            {
              name: 'testRule',
              match: '/default-forward',
              // forwardCookies not specified
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      // Checks if the forward_cookies behavior is not included when forwardCookies is false or not specified
      expect(result.rules[0].behaviors).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'forward_cookies',
          }),
        ]),
      );
      expect(result.rules[1].behaviors).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'forward_cookies',
          }),
        ]),
      );
    });
    it('should correctly process the setOrigin rule with all optional fields provided', () => {
      const azionConfigWithAllFields = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/_next',
              setOrigin: {
                name: 'my origin storage',
                type: 'object_storage',
              },
            },
          ],
        },
      };
      const resultWithAllFields = processManifestConfig(
        azionConfigWithAllFields,
      );
      expect(resultWithAllFields.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'set_origin',
            target: 'my origin storage',
          }),
        ]),
      );
    });

    it('should throw an error when "type" is missing in "setOrigin"', () => {
      const azionConfigWithTypeMissing = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/_next_no_type',
              setOrigin: {
                name: 'nameWithoutType',
                // type is missing
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfigWithTypeMissing)).toThrow(
        "The 'name or type' field is required in the 'setOrigin' object.",
      );
    });

    it('should throw an error for an undefined property', () => {
      const azionConfigWithUndefinedProperty = {
        cache: [
          {
            name: 'testCache',
            undefinedProperty: 'This property does not exist',
          },
        ],
      };

      expect(() =>
        processManifestConfig(azionConfigWithUndefinedProperty),
      ).toThrow('No additional properties are allowed in cache item objects.');
    });

    it('should correctly process the runFunction behavior with only the required path', () => {
      const azionConfigWithRunFunctionOnlyPath = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/run-function-test-path-only',
              runFunction: {
                path: '.edge/worker.js',
              },
            },
          ],
        },
      };

      const expectedBehaviorPathOnly = {
        target: '.edge/worker.js',
      };

      const resultPathOnly = processManifestConfig(
        azionConfigWithRunFunctionOnlyPath,
      );
      expect(resultPathOnly.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining(expectedBehaviorPathOnly),
        ]),
      );
    });
    it('should include the behavior deliver when deliver is true', () => {
      const azionConfigComDeliver = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/path',
              deliver: true,
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfigComDeliver);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'deliver',
          }),
        ]),
      );
    });
    it('should throw an error if deliver is not a boolean', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/path',
              deliver: 'true', // Incorretamente definido como string
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "The 'deliver' field must be a boolean or null.",
      );
    });

    it('should throw an error if setCookie is not a string', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              setCookie: true, // Incorretamente definido como boolean
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "The 'setCookie' field must be a string or null.",
      );
    });

    it('should throw an error if setHeaders is not a string', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              setHeaders: { key: 'value' }, // Incorretamente definido como objeto
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "The 'setHeaders' field must be a string or null.",
      );
    });

    it('should correctly add deliver behavior when deliver is true', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/path',
              deliver: true,
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'deliver',
          }),
        ]),
      );
    });

    it('should correctly add setCookie behavior with a valid string', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              setCookie: 'sessionId=abc123',
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_request_cookie',
            target: 'sessionId=abc123',
          }),
        ]),
      );
    });

    it('should correctly add setHeaders behavior with a valid string', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              setHeaders: 'Authorization: Bearer abc123',
            },
          ],
        },
      };

      const result = processManifestConfig(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_request_header',
            target: 'Authorization: Bearer abc123',
          }),
        ]),
      );
    });
  });

  describe('processManifestConfig - Origin', () => {
    it('should process the manifest config when the origin name and type are the same as the rules setOrigin name and type', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my origin storage',
                type: 'object_storage',
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).not.toThrow();
      const result = processManifestConfig(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my origin storage',
            origin_type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          }),
        ]),
      );
    });

    it('should throw an error when the origin name is different from the rules setOrigin name', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'another origin storage',
                type: 'object_storage',
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "Rule setOrigin name 'another origin storage' not found in the origin settings",
      );
    });

    it('should throw an error when the origin type is different from the rules setOrigin type', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my origin storage',
                type: 'another_type',
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "Rule setOrigin name 'my origin storage' not found in the origin settings",
      );
    });

    it('should throw an error when the origin settings are not defined', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my origin storage',
                type: 'object_storage',
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "Rule setOrigin name 'my origin storage' not found in the origin settings",
      );
    });

    // should throw an error when the origin type is incorret
    it('should throw an error when the origin type is incorrect', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'name_incorrect',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my origin storage',
                type: 'another_type',
              },
            },
          ],
        },
      };

      expect(() => processManifestConfig(azionConfig)).toThrow(
        "Rule setOrigin originType 'name_incorrect' is not supported",
      );
    });

    it('should correctly process the manifest config when the origin is single_origin', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single origin',
            type: 'single_origin',
            hostHeader: 'www.example.com',
            addresses: ['test.com'],
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              setOrigin: {
                name: 'my single origin',
                type: 'single_origin',
              },
            },
          ],
        },
      };
      expect(() => processManifestConfig(azionConfig)).not.toThrow();
      const result = processManifestConfig(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my single origin',
            origin_type: 'single_origin',
            addresses: [
              {
                address: 'test.com',
              },
            ],
            host_header: 'www.example.com',
          }),
        ]),
      );
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'set_origin',
            target: 'my single origin',
          }),
        ]),
      );
    });
  });
});
