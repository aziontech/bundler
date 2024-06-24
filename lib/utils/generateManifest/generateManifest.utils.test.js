import { describe, expect } from '@jest/globals';
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
          addresses: ['teste.com'],
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
          addresses: ['teste.com'],
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
});
