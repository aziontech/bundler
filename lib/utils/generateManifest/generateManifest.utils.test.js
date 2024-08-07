import { describe, expect, it } from '@jest/globals';
import { jsToJson } from './generateManifest.utils.js';

describe('Utils - generateManifest', () => {
  describe('jsToJson', () => {
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

      expect(() => jsToJson(azionConfig)).toThrow(
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
              behavior: {
                setCache: {
                  name: 'directCache',
                  browser_cache_settings_maximum_ttl: 300,
                  cdn_cache_settings_maximum_ttl: 600,
                },
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result).toHaveProperty('cache');
      expect(result.cache).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'directCache' }),
        ]),
      );
    });

    it('should handle rewrites directly as a string', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'simpleRewriteRule',
              match: '/simple',
              behavior: {
                rewrite: '/new-path',
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'rewrite_request',
            target: '/new-path',
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

      const result = jsToJson(azionConfig);
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
              behavior: {
                runFunction: {
                  path: '.edge/worker.js',
                },
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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

      const result = jsToJson(azionConfig);
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

      expect(() => jsToJson(azionConfig)).toThrow(
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
              behavior: {
                forwardCookies: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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
              behavior: {
                forwardCookies: false,
              },
            },
            {
              name: 'testRule',
              match: '/default-forward',
              // forwardCookies not specified
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };
      const resultWithAllFields = jsToJson(azionConfigWithAllFields);
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
              behavior: {
                setOrigin: {
                  name: 'nameWithoutType',
                  // type is missing
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfigWithTypeMissing)).toThrow(
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

      expect(() => jsToJson(azionConfigWithUndefinedProperty)).toThrow(
        'No additional properties are allowed in cache item objects.',
      );
    });

    it('should correctly process the runFunction behavior with only the required path', () => {
      const azionConfigWithRunFunctionOnlyPath = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/run-function-test-path-only',
              behavior: {
                runFunction: {
                  path: '.edge/worker.js',
                },
              },
            },
          ],
        },
      };

      const expectedBehaviorPathOnly = {
        target: '.edge/worker.js',
      };

      const resultPathOnly = jsToJson(azionConfigWithRunFunctionOnlyPath);
      expect(resultPathOnly.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining(expectedBehaviorPathOnly),
        ]),
      );
    });

    it('should include the behavior deliver when deliver is true', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/path',
              behavior: {
                deliver: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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
              behavior: {
                deliver: 'true', // Incorrectly defined as string
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
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
              behavior: {
                setCookie: true, //  Incorrectly defined as boolean
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'setCookie' field must be a string or null.",
      );
    });

    it('should throw an error if setHeaders is not an array of strings', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              behavior: {
                setHeaders: { key: 'value' }, // Incorrectly defined as object
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'setHeaders' field must be an array of strings.",
      );
    });

    it('should correctly add deliver behavior when deliver is true', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/path',
              behavior: {
                deliver: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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
              behavior: {
                setCookie: 'sessionId=abc123',
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_request_cookie',
            target: 'sessionId=abc123',
          }),
        ]),
      );
    });

    it('should correctly add setHeaders behavior with a valid array', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/',
              behavior: {
                setHeaders: ['Authorization: Bearer abc123'], // Corretamente definido como uma array de strings
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
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

  describe('jsToJson - Origin', () => {
    it('should process the manifest config when the origin is single_origin and all fields', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single origin',
            type: 'single_origin',
            path: '/',
            addresses: [
              {
                address: 'http.bin.org',
              },
            ],
            protocolPolicy: 'preserve',
            hostHeader: '${host}',
            method: 'ip_hash',
            redirection: true,
            connectionTimeout: 60,
            timeoutBetweenBytes: 120,
            hmac: {
              region: 'us-east-1',
              accessKey: 'myaccesskey',
              secretKey: 'secretKey',
            },
          },
        ],
      };
      const result = jsToJson(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my single origin',
            origin_type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
              },
            ],
            origin_path: '/',
            method: 'ip_hash',
            origin_protocol_policy: 'preserve',
            host_header: '${host}',
            is_origin_redirection_enabled: true,
            connection_timeout: 60,
            timeout_between_bytes: 120,
            hmac_authentication: true,
            hmac_region_name: 'us-east-1',
            hmac_access_key: 'myaccesskey',
            hmac_secret_key: 'secretKey',
          }),
        ]),
      );
    });

    it('should process the manifest config when the origin is provided id and key', () => {
      const azionConfig = {
        origin: [
          {
            id: 123456,
            key: 'abcdef',
            name: 'my single',
            type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
              },
            ],
          },
        ],
      };
      const result = jsToJson(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 123456,
            key: 'abcdef',
            name: 'my single',
            origin_type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
              },
            ],
          }),
        ]),
      );
    });

    it('should throw an error when the origin type single_origin is missing the addresses field', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single',
            type: 'single_origin',
          },
        ],
      };
      expect(() => jsToJson(azionConfig)).toThrow(
        'When origin type is single_origin, addresses is required',
      );
    });

    // should process the manifest config when the origin is single_origin and addresses is array of strings
    it('should process the manifest config when the origin is single_origin and addresses is array of strings', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single',
            type: 'single_origin',
            addresses: ['http.bin.org', 'http2.bin.org'],
          },
        ],
      };
      const result = jsToJson(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my single',
            origin_type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
              },
              {
                address: 'http2.bin.org',
              },
            ],
          }),
        ]),
      );
    });

    it('should throw an error when the origin type single_origin the addresses weight is invalid', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single',
            type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
                weight: 1,
              },
              {
                address: 'http2.bin.org',
                weight: 11,
              },
            ],
          },
        ],
      };
      expect(() => jsToJson(azionConfig)).toThrow(
        'When origin type is single_origin, weight must be between 0 and 10',
      );
    });

    it('should process the manifest config when the origin is object_storage and all fields', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my origin storage',
            type: 'object_storage',
            bucket: 'mybucket',
            prefix: 'myfolder',
          },
        ],
      };
      const result = jsToJson(azionConfig);
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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).not.toThrow();
      const result = jsToJson(azionConfig);
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
              behavior: {
                setOrigin: {
                  name: 'another origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'another_type',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "Rule setOrigin name 'my origin storage' not found in the origin settings",
      );
    });

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
              behavior: {
                setOrigin: {
                  name: 'my origin storage',
                  type: 'another_type',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'type' field must be a string and one of 'single_origin', 'object_storage', 'load_balancer' or 'live_ingest'.",
      );
    });

    it('should correctly process the manifest config when the origin is single_origin', () => {
      const azionConfig = {
        origin: [
          {
            name: 'my single origin',
            type: 'single_origin',
            hostHeader: 'www.example.com',
            addresses: [
              {
                address: 'http.bin.org',
              },
            ],
          },
        ],
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              behavior: {
                setOrigin: {
                  name: 'my single origin',
                  type: 'single_origin',
                },
              },
            },
          ],
        },
      };
      expect(() => jsToJson(azionConfig)).not.toThrow();
      const result = jsToJson(azionConfig);
      expect(result.origin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'my single origin',
            origin_type: 'single_origin',
            addresses: [
              {
                address: 'http.bin.org',
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

  describe('jsToJson - Rules', () => {
    it('should correctly handle bypassCache behavior', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testBypassCache',
              match: '/',
              behavior: {
                bypassCache: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'bypass_cache_phase',
            target: null,
          }),
        ]),
      );
    });

    it('should correctly handle redirect to 301', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRedirect301',
              match: '/',
              behavior: {
                redirectTo301: 'https://example.com',
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'redirect_to_301',
            target: 'https://example.com',
          }),
        ]),
      );
    });

    it('should correctly handle redirect to 302', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testRedirect302',
              match: '/',
              behavior: {
                redirectTo302: 'https://example.com',
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'redirect_to_302',
            target: 'https://example.com',
          }),
        ]),
      );
    });

    it('should correctly handle capture match groups', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'testCapture',
              match: '/',
              behavior: {
                capture: {
                  match: '^/user/(.*)',
                  captured: 'userId',
                  subject: 'uri',
                },
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'capture_match_groups',
            target: {
              regex: '^/user/(.*)',
              captured_array: 'userId',
              // eslint-disable-next-line no-template-curly-in-string
              subject: '${uri}',
            },
          }),
        ]),
      );
    });

    it('should correctly handle filterCookie behavior', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'testFilterCookie',
              match: '/',
              behavior: {
                filterCookie: '_cookie',
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'filter_response_cookie',
            target: '_cookie',
          }),
        ]),
      );
    });

    it('should correctly process rules in the response phase', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'testResponsePhase',
              match: '/',
              behavior: {
                setHeaders: ['X-Test-Header: value'],
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_response_header',
            target: 'X-Test-Header: value',
          }),
        ]),
      );
    });

    it('should correctly add multiple response headers', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'testMultipleHeaders',
              match: '/',
              behavior: {
                setHeaders: [
                  'X-Frame-Options: DENY',
                  "Content-Security-Policy: default-src 'self'",
                ],
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_response_header',
            target: 'X-Frame-Options: DENY',
          }),
          expect.objectContaining({
            name: 'add_response_header',
            target: "Content-Security-Policy: default-src 'self'",
          }),
        ]),
      );
    });

    it('should correctly handle enableGZIP behavior', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'testEnableGZIP',
              match: '/',
              behavior: {
                enableGZIP: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'enable_gzip',
            target: '',
          }),
        ]),
      );
    });

    it('should handle rules with description and active properties correctly', () => {
      const azionConfig = {
        rules: {
          request: [
            {
              name: 'Example Rule',
              match: '/',
              description: 'This rule redirects all traffic.',
              active: false,
            },
            {
              name: 'Second Rule',
              match: '/api',
              behavior: {},
              // description is not provided here
              active: true,
            },
            {
              name: 'Third Rule',
              match: '/home',
              description: 'This rule handles home traffic.',
              behavior: {},
              // active is not provided here
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules).toEqual([
        expect.objectContaining({
          name: 'Example Rule',
          description: 'This rule redirects all traffic.',
          is_active: false,
        }),
        expect.objectContaining({
          name: 'Second Rule',
          description: '', // Should default to an empty string
          is_active: true,
        }),
        expect.objectContaining({
          name: 'Third Rule',
          description: 'This rule handles home traffic.',
          is_active: true, // Should default to true
        }),
      ]);
    });

    it('should correctly assign order starting from 2 for request and response rules', () => {
      const azionConfig = {
        rules: {
          request: [
            { name: 'First Request Rule', match: '/', behavior: {} },
            { name: 'Second Request Rule', match: '/second', behavior: {} },
          ],
          response: [
            { name: 'First Response Rule', match: '/', behavior: {} },
            { name: 'Second Response Rule', match: '/second', behavior: {} },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0]).toEqual(
        expect.objectContaining({
          name: 'First Request Rule',
          order: 2,
        }),
      );
      expect(result.rules[1]).toEqual(
        expect.objectContaining({
          name: 'Second Request Rule',
          order: 3,
        }),
      );
      expect(result.rules[2]).toEqual(
        expect.objectContaining({
          name: 'First Response Rule',
          order: 2,
        }),
      );
      expect(result.rules[3]).toEqual(
        expect.objectContaining({
          name: 'Second Response Rule',
          order: 3,
        }),
      );
    });

    it('should maintain the order of behaviors as specified by the user', () => {
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
              match: '/',
              behavior: {
                setHeaders: ['Authorization: Bearer abc123'],
                deliver: true,
                setOrigin: {
                  name: 'my origin storage',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual([
        expect.objectContaining({
          name: 'add_request_header',
          target: 'Authorization: Bearer abc123',
        }),
        expect.objectContaining({
          name: 'deliver',
        }),
        expect.objectContaining({
          name: 'set_origin',
          target: 'my origin storage',
        }),
      ]);
    });
    it('should throw an error when the origin settings are not defined', () => {
      const azionConfigWithoutOrigin = {
        rules: {
          request: [
            {
              name: 'testRule',
              match: '/api',
              behavior: {
                setOrigin: {
                  name: 'undefined origin',
                  type: 'object_storage',
                },
              },
            },
          ],
        },
      };

      expect(() => jsToJson(azionConfigWithoutOrigin)).toThrow(
        "Rule setOrigin name 'undefined origin' not found in the origin settings",
      );
    });
    it('should handle legacy config without behavior field for request rules', () => {
      const azionConfig = {
        origin: [
          {
            name: 'legacy origin',
            type: 'object_storage',
          },
        ],
        rules: {
          request: [
            {
              name: 'legacyRule',
              match: '/legacy',
              setOrigin: {
                name: 'legacy origin',
                type: 'object_storage',
              },
              setHeaders: ['Authorization: Bearer legacy'],
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'set_origin',
            target: 'legacy origin',
          }),
          expect.objectContaining({
            name: 'add_request_header',
            target: 'Authorization: Bearer legacy',
          }),
        ]),
      );
    });

    it('should handle legacy config without behavior field for response rules', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'legacyResponseRule',
              match: '/legacy-response',
              setHeaders: ['X-Legacy-Header: legacy'],
              enableGZIP: true,
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_response_header',
            target: 'X-Legacy-Header: legacy',
          }),
          expect.objectContaining({
            name: 'enable_gzip',
            target: '',
          }),
        ]),
      );
    });

    it('should handle mixed legacy and new config for request rules', () => {
      const azionConfig = {
        origin: [
          {
            name: 'mixed origin',
            type: 'object_storage',
          },
        ],
        rules: {
          request: [
            {
              name: 'mixedRule',
              match: '/mixed',
              setOrigin: {
                name: 'mixed origin',
                type: 'object_storage',
              },
              behavior: {
                setHeaders: ['Authorization: Bearer mixed'],
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'set_origin',
            target: 'mixed origin',
          }),
          expect.objectContaining({
            name: 'add_request_header',
            target: 'Authorization: Bearer mixed',
          }),
        ]),
      );
    });

    it('should handle mixed legacy and new config for response rules', () => {
      const azionConfig = {
        rules: {
          response: [
            {
              name: 'mixedResponseRule',
              match: '/mixed-response',
              setHeaders: ['X-Mixed-Header: mixed'],
              behavior: {
                enableGZIP: true,
              },
            },
          ],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.rules[0].behaviors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'add_response_header',
            target: 'X-Mixed-Header: mixed',
          }),
          expect.objectContaining({
            name: 'enable_gzip',
            target: '',
          }),
        ]),
      );
    });
    it('should correctly process cacheByQueryString with option "ignore"', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByQueryString: {
              option: 'ignore',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_query_string: 'ignore',
          query_string_fields: [],
        }),
      );
    });

    it('should correctly process cacheByQueryString with option "whitelist" and list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByQueryString: {
              option: 'whitelist',
              list: ['param1', 'param2'],
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_query_string: 'whitelist',
          query_string_fields: ['param1', 'param2'],
        }),
      );
    });

    it('should throw an error if cacheByQueryString option is "whitelist" or "blacklist" without list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByQueryString: {
              option: 'whitelist',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'list' field is required when 'option' is 'whitelist' or 'blacklist'.",
      );
    });

    it('should correctly process cacheByQueryString with option "blacklist" and list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByQueryString: {
              option: 'blacklist',
              list: ['param1', 'param2'],
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_query_string: 'blacklist',
          query_string_fields: ['param1', 'param2'],
        }),
      );
    });

    it('should correctly process cacheByQueryString with option "all"', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByQueryString: {
              option: 'varies',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_query_string: 'all',
          query_string_fields: [],
        }),
      );
    });
    it('should correctly process cacheByCookie with option "ignore"', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByCookie: {
              option: 'ignore',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_cookie: 'ignore',
          cookie_names: [],
        }),
      );
    });

    it('should correctly process cacheByCookie with option "whitelist" and list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByCookie: {
              option: 'whitelist',
              list: ['cookie1', 'cookie2'],
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_cookie: 'whitelist',
          cookie_names: ['cookie1', 'cookie2'],
        }),
      );
    });

    it('should throw an error if cacheByCookie option is "whitelist" or "blacklist" without list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByCookie: {
              option: 'whitelist',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'list' field is required when 'option' is 'whitelist' or 'blacklist'.",
      );
    });

    it('should correctly process cacheByCookie with option "blacklist" and list', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByCookie: {
              option: 'blacklist',
              list: ['cookie1', 'cookie2'],
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_cookie: 'blacklist',
          cookie_names: ['cookie1', 'cookie2'],
        }),
      );
    });

    it('should correctly process cacheByCookie with option "all"', () => {
      const azionConfig = {
        cache: [
          {
            name: 'testCache',
            cacheByCookie: {
              option: 'varies',
            },
          },
        ],
        rules: {
          request: [],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.cache[0]).toEqual(
        expect.objectContaining({
          cache_by_cookie: 'all',
          cookie_names: [],
        }),
      );
    });
  });

  describe('jsToJson - Domain', () => {
    it('should throw process the manifest config when the domain name is not provided', () => {
      const azionConfig = {
        domain: {
          cnames: ['www.example.com'],
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'name' field is required in the domain object.",
      );
    });

    it('should correctly process the manifest config when the domain cnameAccessOnly undefined', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          cnames: ['www.example.com'],
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          cname_access_only: false,
          cnames: ['www.example.com'],
        }),
      );
    });

    it('should correctly process the manifest config when the domain cnameAccessOnly is true', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          cnames: ['www.example.com'],
          cnameAccessOnly: true,
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          cname_access_only: true,
          cnames: ['www.example.com'],
        }),
      );
    });

    it('should throw process the manifest config when the domain cnames is not an array', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          cnames: 'www.example.com',
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'cnames' field must be an array of strings.",
      );
    });

    it('should throw process the manifest config when the domain digitalCertificateId different from lets_encrypt', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          digitalCertificateId: 'mycert',
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        'Domain mydomain has an invalid digital certificate ID: mycert',
      );
    });

    it('should correctly process the manifest config when the domain digitalCertificateId is lets_encrypt', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          digitalCertificateId: 'lets_encrypt',
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          digital_certificate_id: 'lets_encrypt',
        }),
      );
    });

    it('should correctly process the manifest config when the domain digitalCertificateId is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          digital_certificate_id: null,
        }),
      );
    });

    it('should correctly process the manifest config when the domain mtls is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
        },
      };
      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          is_mtls_enabled: false,
        }),
      );
    });

    it('should correctly process the manifest config when the domain mtls is active and verification equal enforce', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          mtls: {
            verification: 'enforce',
            trustedCaCertificateId: 12345,
          },
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          is_mtls_enabled: true,
          mtls_verification: 'enforce',
          mtls_trusted_ca_certificate_id: 12345,
        }),
      );
    });

    it('should correctly process the manifest config when the domain mtls is active and verification equal permissive', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          mtls: {
            verification: 'permissive',
            trustedCaCertificateId: 12345,
          },
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          is_mtls_enabled: true,
          mtls_verification: 'permissive',
          mtls_trusted_ca_certificate_id: 12345,
        }),
      );
    });

    it('should throw an error when the domain verification is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          mtls: {
            trustedCaCertificateId: 12345,
          },
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'verification and trustedCaCertificateId' fields are required in the mtls object.",
      );
    });

    it('should throw an error when the domain trustedCaCertificateId is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          mtls: {
            verification: 'enforce',
          },
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'verification and trustedCaCertificateId' fields are required in the mtls object.",
      );
    });

    it('should correctly process the manifest config when the domain mtls and crlList is present', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          mtls: {
            verification: 'enforce',
            trustedCaCertificateId: 12345,
            crlList: [123, 456],
          },
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          is_mtls_enabled: true,
          mtls_verification: 'enforce',
          mtls_trusted_ca_certificate_id: 12345,
          crl_list: [123, 456],
        }),
      );
    });

    it('should correctly process the manifest config when the domain edgeApplicationId is provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          edgeApplicationId: 12345,
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          edge_application_id: 12345,
        }),
      );
    });

    it('should throw an error when the domain edgeApplicationId is not a number', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          edgeApplicationId: '12345',
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'edgeApplicationId' field must be a number.",
      );
    });

    it('should correctly process the manifest config when the domain edgeApplicationId is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          edge_application_id: null,
        }),
      );
    });

    it('should correctly process the manifest config when the domain edgeFirewallId is provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          edgeFirewallId: 12345,
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          edge_firewall_id: 12345,
        }),
      );
    });

    it('should throw an error when the domain edgeFirewallId is not a number', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
          edgeFirewallId: '12345',
        },
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'edgeFirewallId' field must be a number.",
      );
    });

    it('should correctly process the manifest config when the domain edgeFirewallId is not provided', () => {
      const azionConfig = {
        domain: {
          name: 'mydomain',
        },
      };

      const result = jsToJson(azionConfig);
      expect(result.domain).toEqual(
        expect.objectContaining({
          name: 'mydomain',
          edge_firewall_id: null,
        }),
      );
    });
  });

  describe('jsToJson - Purge', () => {
    it('should correctly process the manifest config when the purge is type url', () => {
      const azionConfig = {
        purge: [
          {
            type: 'url',
            urls: ['https://example.com'],
          },
        ],
      };

      const result = jsToJson(azionConfig);
      expect(result.purge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'url',
            urls: ['https://example.com'],
            method: 'delete',
          }),
        ]),
      );
    });

    it('should correctly process the manifest config when the purge is type url and method is provided', () => {
      const azionConfig = {
        purge: [
          {
            type: 'url',
            urls: ['https://example.com'],
            method: 'delete',
          },
        ],
      };

      const result = jsToJson(azionConfig);
      expect(result.purge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'url',
            urls: ['https://example.com'],
            method: 'delete',
          }),
        ]),
      );
    });

    it('should throw an error when the purge is method is invalid', () => {
      const azionConfig = {
        purge: [
          {
            type: 'url',
            urls: ['https://example.com'],
            method: 'invalid',
          },
        ],
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'method' field must be either 'delete'. Default is 'delete'.",
      );
    });

    it('should throw an error when the purge is type is invalid', () => {
      const azionConfig = {
        purge: [
          {
            type: 'invalid',
            urls: ['https://example.com'],
          },
        ],
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'type' field must be either 'url', 'cachekeys' or 'wildcard'.",
      );
    });

    it('should correctly process the manifest config when the purge is type cachekeys', () => {
      const azionConfig = {
        purge: [
          {
            type: 'cachekeys',
            urls: ['https://example.com/test1', 'https://example.com/test2'],
          },
        ],
      };

      const result = jsToJson(azionConfig);
      expect(result.purge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'cachekeys',
            urls: ['https://example.com/test1', 'https://example.com/test2'],
            method: 'delete',
          }),
        ]),
      );
    });

    it('should correctly process the manifest config when the purge is type cachekeys and layer is provided', () => {
      const azionConfig = {
        purge: [
          {
            type: 'cachekeys',
            urls: ['https://example.com/test1', 'https://example.com/test2'],
            layer: 'edge_caching',
          },
        ],
      };

      const result = jsToJson(azionConfig);
      expect(result.purge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'cachekeys',
            urls: ['https://example.com/test1', 'https://example.com/test2'],
            method: 'delete',
            layer: 'edge_caching',
          }),
        ]),
      );
    });

    it('should throw an error when the purge is type cachekeys and layer is invalid', () => {
      const azionConfig = {
        purge: [
          {
            type: 'cachekeys',
            urls: ['https://example.com/test'],
            layer: 'invalid',
          },
        ],
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'layer' field must be either 'edge_caching' or 'l2_caching'. Default is 'edge_caching'.",
      );
    });

    it('should correctly process the manifest config when the purge is type wildcard', () => {
      const azionConfig = {
        purge: [
          {
            type: 'wildcard',
            urls: ['https://example.com/*'],
          },
        ],
      };

      const result = jsToJson(azionConfig);
      expect(result.purge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'wildcard',
            urls: ['https://example.com/*'],
            method: 'delete',
          }),
        ]),
      );
    });

    it('should throw an error when the purge urls is not an array', () => {
      const azionConfig = {
        purge: [
          {
            type: 'url',
            urls: 'https://example.com',
          },
        ],
      };

      expect(() => jsToJson(azionConfig)).toThrow(
        "The 'urls' field must be an array of strings.",
      );
    });
  });
});
