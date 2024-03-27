import { processManifestConfig } from './generateManifest.utils.js';

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
          rule: 'rewrite_request',
          target: expect.stringContaining('/%{other[0]}/%{other[1]}'), // Updated from 'params' to 'target'
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
      rules: {
        request: [
          {
            match: '/api',
            setOrigin: {
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
              rule: 'set_origin',
              target: {
                origin_type: 'object_storage',
                bucket: '',
                prefix: '/',
              },
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
          rule: 'forward_cookies',
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
            match: '/no-forward',
            forwardCookies: false,
          },
          {
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
          rule: 'forward_cookies',
        }),
      ]),
    );
    expect(result.rules[1].behaviors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'forward_cookies',
        }),
      ]),
    );
  });
  it('should correctly process the setOrigin rule with all optional fields provided', () => {
    const azionConfigWithAllFields = {
      rules: {
        request: [
          {
            match: '/_next',
            setOrigin: {
              name: 'optionalName',
              type: 'object_storage',
              bucket: 'optionalBucket',
              prefix: 'customPrefix',
            },
          },
        ],
      },
    };

    const resultWithAllFields = processManifestConfig(azionConfigWithAllFields);
    expect(resultWithAllFields.rules[0].behaviors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'set_origin',
          target: {
            origin_type: 'object_storage',
            bucket: 'optionalBucket',
            prefix: 'customPrefix',
          },
        }),
      ]),
    );
  });

  it('should throw an error when "type" is missing in "setOrigin"', () => {
    const azionConfigWithTypeMissing = {
      rules: {
        request: [
          {
            match: '/_next_no_type',
            setOrigin: {
              name: 'nameWithoutType',
              bucket: 'bucketWithoutType',
              // type is missing
            },
          },
        ],
      },
    };

    expect(() => processManifestConfig(azionConfigWithTypeMissing)).toThrow(
      "The 'type' field is required in the 'setOrigin' object.",
    );
  });

  it('should correctly process the setOrigin rule with default prefix when not specified', () => {
    const azionConfigWithDefaultPrefix = {
      rules: {
        request: [
          {
            match: '/_next_default_prefix',
            setOrigin: {
              type: 'object_storage',
              bucket: 'test',
              // prefix is missing, should default to '/'
            },
          },
        ],
      },
    };

    const resultWithDefaultPrefix = processManifestConfig(
      azionConfigWithDefaultPrefix,
    );
    expect(resultWithDefaultPrefix.rules[0].behaviors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'set_origin',
          target: {
            origin_type: 'object_storage',
            bucket: 'test',
            prefix: '/',
          },
        }),
      ]),
    );
  });

  it('should correctly process the setOrigin rule when bucket and name are not provided', () => {
    const azionConfigWithNullBucketName = {
      rules: {
        request: [
          {
            match: '/_next_null_bucket_name',
            setOrigin: {
              type: 'object_storage',
              // bucket and name are null or not provided
            },
          },
        ],
      },
    };

    const resultWithNullBucketName = processManifestConfig(
      azionConfigWithNullBucketName,
    );
    expect(resultWithNullBucketName.rules[0].behaviors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'set_origin',
          target: {
            origin_type: 'object_storage',
            bucket: '',
            prefix: '/',
          },
        }),
      ]),
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

  it('should correctly process the runFunction behavior with a valid path and optional name', () => {
    const azionConfigWithRunFunction = {
      rules: {
        request: [
          {
            match: '/run-function-test',
            runFunction: {
              path: '.edge/worker.js',
              name: 'optionalFunctionName',
            },
          },
        ],
      },
    };

    const expectedBehavior = {
      name: 'optionalFunctionName',
      target: '.edge/worker.js',
    };

    const result = processManifestConfig(azionConfigWithRunFunction);
    expect(result.rules[0].behaviors).toEqual(
      expect.arrayContaining([expect.objectContaining(expectedBehavior)]),
    );
  });

  it('should correctly process the runFunction behavior with only the required path', () => {
    const azionConfigWithRunFunctionOnlyPath = {
      rules: {
        request: [
          {
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
          rule: 'deliver',
        }),
      ]),
    );
  });
  it('should throw an error if deliver is not a boolean', () => {
    const azionConfig = {
      rules: {
        request: [
          {
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
          rule: 'deliver',
        }),
      ]),
    );
  });

  it('should correctly add setCookie behavior with a valid string', () => {
    const azionConfig = {
      rules: {
        request: [
          {
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
          rule: 'add_request_cookie',
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
          rule: 'add_request_header',
          target: 'Authorization: Bearer abc123',
        }),
      ]),
    );
  });
});
