const azionConfigSchema = {
  type: 'object',
  properties: {
    origin: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            errorMessage: "The 'id' field must be a number.",
          },
          key: {
            type: 'string',
            errorMessage: "The 'key' field must be a string.",
          },
          name: {
            type: 'string',
            errorMessage: "The 'name' field must be a string.",
          },
          type: {
            type: 'string',
            enum: [
              'single_origin',
              'object_storage',
              'load_balancer',
              'live_ingest',
            ],
            errorMessage:
              "The 'type' field must be a string and one of 'single_origin', 'object_storage', 'load_balancer' or 'live_ingest'.",
          },
          bucket: {
            type: ['string', 'null'],
            errorMessage: "The 'bucket' field must be a string or null.",
          },
          prefix: {
            type: ['string', 'null'],
            errorMessage: "The 'prefix' field must be a string or null.",
          },
          addresses: {
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
                errorMessage: {
                  type: "The 'addresses' field must be an array of strings.",
                },
              },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string',
                      errorMessage: "The 'address' field must be a string.",
                    },
                    weight: {
                      type: 'integer',
                    },
                  },
                  required: ['address'],
                  additionalProperties: false,
                  errorMessage: {
                    type: "The 'addresses' field must be an array of objects.",
                    additionalProperties:
                      'No additional properties are allowed in address items.',
                    required:
                      "The 'address' field is required in each address item.",
                  },
                },
              },
            ],
          },
          hostHeader: {
            type: 'string',
            errorMessage: "The 'hostHeader' field must be a string.",
          },
          protocolPolicy: {
            type: 'string',
            enum: ['preserve', 'http', 'https'],
            errorMessage:
              "The 'protocolPolicy' field must be either 'http', 'https' or 'preserve'. Default is 'preserve'.",
          },
          redirection: {
            type: 'boolean',
            errorMessage: "The 'redirection' field must be a boolean.",
          },
          method: {
            type: 'string',
            enum: ['ip_hash', 'least_connections', 'round_robin'],
            errorMessage:
              "The 'method' field must be either 'ip_hash', 'least_connections' or 'round_robin'. Default is 'ip_hash'.",
          },
          path: {
            type: 'string',
            errorMessage: "The 'path' field must be a string.",
          },
          connectionTimeout: {
            type: 'integer',
            errorMessage:
              "The 'connectionTimeout' field must be a number. Default is 60.",
          },
          timeoutBetweenBytes: {
            type: 'integer',
            errorMessage:
              "The 'timeoutBetweenBytes' field must be a number. Default is 120.",
          },
          hmac: {
            type: 'object',
            properties: {
              region: {
                type: 'string',
                errorMessage: "The 'region' field must be a string.",
              },
              accessKey: {
                type: 'string',
                errorMessage: "The 'accessKey' field must be a string.",
              },
              secretKey: {
                type: 'string',
                errorMessage: "The 'secretKey' field must be a string.",
              },
            },
            required: ['region', 'accessKey', 'secretKey'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                'No additional properties are allowed in the hmac object.',
              required:
                "The 'region, accessKey and secretKey' fields are required in the hmac object.",
            },
          },
        },
        required: ['name', 'type'],
        additionalProperties: false,
        errorMessage: {
          additionalProperties:
            'No additional properties are allowed in origin item objects.',
          required:
            "The 'name and type' field is required in each origin item.",
        },
      },
      errorMessage: {
        additionalProperties: "The 'origin' field must be an array of objects.",
      },
    },
    cache: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            errorMessage: "The 'name' field must be a string.",
          },
          stale: {
            type: 'boolean',
            errorMessage: "The 'stale' field must be a boolean.",
          },
          queryStringSort: {
            type: 'boolean',
            errorMessage: "The 'queryStringSort' field must be a boolean.",
          },
          methods: {
            type: 'object',
            properties: {
              post: {
                type: 'boolean',
                errorMessage: "The 'post' field must be a boolean.",
              },
              options: {
                type: 'boolean',
                errorMessage: "The 'options' field must be a boolean.",
              },
            },
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                "No additional properties are allowed in the 'methods' object.",
            },
          },
          browser: {
            type: 'object',
            properties: {
              maxAgeSeconds: {
                oneOf: [
                  {
                    type: 'number',
                    errorMessage:
                      "The 'maxAgeSeconds' field must be a number or a valid mathematical expression.",
                  },
                  {
                    type: 'string',
                    pattern: '^[0-9+*/.() -]+$',
                    errorMessage:
                      "The 'maxAgeSeconds' field must be a valid mathematical expression.",
                  },
                ],
              },
            },
            required: ['maxAgeSeconds'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                "No additional properties are allowed in the 'browser' object.",
              required:
                "The 'maxAgeSeconds' field is required in the 'browser' object.",
            },
          },
          edge: {
            type: 'object',
            properties: {
              maxAgeSeconds: {
                oneOf: [
                  {
                    type: 'number',
                    errorMessage:
                      "The 'maxAgeSeconds' field must be a number or a valid mathematical expression.",
                  },
                  {
                    type: 'string',
                    pattern: '^[0-9+*/.() -]+$',
                    errorMessage:
                      "The 'maxAgeSeconds' field must be a valid mathematical expression.",
                  },
                ],
              },
            },
            required: ['maxAgeSeconds'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                "No additional properties are allowed in the 'edge' object.",
              required:
                "The 'maxAgeSeconds' field is required in the 'edge' object.",
            },
          },
          cacheByCookie: {
            type: 'object',
            properties: {
              option: {
                type: 'string',
                enum: ['ignore', 'varies', 'whitelist', 'blacklist'],
                errorMessage:
                  "The 'option' field must be one of 'ignore', 'varies', 'whitelist' or 'blacklist'..",
              },
              list: {
                type: 'array',
                items: {
                  type: 'string',
                  errorMessage: "Each item in 'list' must be a string.",
                },
                errorMessage: {
                  type: "The 'list' field must be an array of strings.",
                },
              },
            },
            required: ['option'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                "No additional properties are allowed in the 'cacheByCookie' object.",
              required:
                "The 'option' field is required in the 'cacheByCookie' object.",
            },
            if: {
              properties: {
                option: { enum: ['whitelist', 'blacklist'] },
              },
            },
            then: {
              required: ['list'],
              errorMessage: {
                required:
                  "The 'list' field is required when 'option' is 'whitelist' or 'blacklist'.",
              },
            },
          },

          cacheByQueryString: {
            type: 'object',
            properties: {
              option: {
                type: 'string',
                enum: ['ignore', 'varies', 'whitelist', 'blacklist'],
                errorMessage:
                  "The 'option' field must be one of 'ignore', 'varies', 'whitelist' or 'blacklist'.",
              },
              list: {
                type: 'array',
                items: {
                  type: 'string',
                  errorMessage: "Each item in 'list' must be a string.",
                },
                errorMessage: {
                  type: "The 'list' field must be an array of strings.",
                },
              },
            },
            required: ['option'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                "No additional properties are allowed in the 'cacheByQueryString' object.",
              required:
                "The 'option' field is required in the 'cacheByQueryString' object.",
            },
            if: {
              properties: {
                option: { enum: ['whitelist', 'blacklist'] },
              },
            },
            then: {
              required: ['list'],
              errorMessage: {
                required:
                  "The 'list' field is required when 'option' is 'whitelist' or 'blacklist'.",
              },
            },
          },
        },
        required: ['name'],
        additionalProperties: false,
        errorMessage: {
          additionalProperties:
            'No additional properties are allowed in cache item objects.',
          required: "The 'name' field is required in each cache item.",
        },
      },
      errorMessage: {
        additionalProperties: "The 'cache' field must be an array of objects.",
      },
    },
    rules: {
      type: 'object',
      properties: {
        request: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                errorMessage: "The 'name' field must be a string.",
              },
              description: {
                type: 'string',
                errorMessage: "The 'description' field must be a string.",
              },
              active: {
                type: 'boolean',
                default: true,
                errorMessage: "The 'active' field must be a boolean.",
              },
              match: {
                type: 'string',
                errorMessage: "The 'match' field must be a string.",
              },
              variable: {
                type: 'string',
                errorMessage: "The 'variable' field must be a string.",
              },
              behavior: {
                type: 'object',
                properties: {
                  setOrigin: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        errorMessage: "The 'name' field must be a string.",
                      },
                      type: {
                        type: 'string',
                        errorMessage: "The 'type' field must be a string.",
                      },
                    },
                    required: ['name', 'type'],
                    additionalProperties: false,
                    errorMessage: {
                      additionalProperties:
                        "No additional properties are allowed in the 'setOrigin' object.",
                      required:
                        "The 'name or type' field is required in the 'setOrigin' object.",
                    },
                  },
                  rewrite: {
                    type: 'string',
                    errorMessage: "The 'rewrite' field must be a string.",
                  },
                  setHeaders: {
                    type: 'array',
                    items: {
                      type: 'string',
                      errorMessage:
                        "Each item in 'setHeaders' must be a string.",
                    },
                    errorMessage: {
                      type: "The 'setHeaders' field must be an array of strings.",
                    },
                  },
                  bypassCache: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'bypassCache' field must be a boolean or null.",
                  },
                  httpToHttps: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'httpToHttps' field must be a boolean or null.",
                  },
                  redirectTo301: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'redirectTo301' field must be a string or null.",
                  },
                  redirectTo302: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'redirectTo302' field must be a string or null.",
                  },
                  forwardCookies: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'forwardCookies' field must be a boolean or null.",
                  },
                  setCookie: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'setCookie' field must be a string or null.",
                  },
                  deliver: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'deliver' field must be a boolean or null.",
                  },
                  capture: {
                    type: 'object',
                    properties: {
                      match: {
                        type: 'string',
                        errorMessage: "The 'match' field must be a string.",
                      },
                      captured: {
                        type: 'string',
                        errorMessage: "The 'captured' field must be a string.",
                      },
                      subject: {
                        type: 'string',
                        errorMessage: "The 'subject' field must be a string.",
                      },
                    },
                    required: ['match', 'captured', 'subject'],
                    additionalProperties: false,
                    errorMessage: {
                      additionalProperties:
                        "No additional properties are allowed in the 'capture' object.",
                      required:
                        "All properties ('match', 'captured', 'subject') are required in the 'capture' object.",
                    },
                  },
                  runFunction: {
                    type: 'object',
                    properties: {
                      path: {
                        type: 'string',
                        errorMessage: "The 'path' field must be a string.",
                      },
                      name: {
                        type: ['string', 'null'],
                        errorMessage:
                          "The 'name' field can be a string or null.",
                      },
                    },
                    required: ['path'],
                    additionalProperties: false,
                    errorMessage: {
                      additionalProperties:
                        "No additional properties are allowed in the 'runFunction' object.",
                      required:
                        "The 'path' field is required in the 'runFunction' object.",
                    },
                  },
                  setCache: {
                    oneOf: [
                      {
                        type: 'string',
                        errorMessage: "The 'setCache' field must be a string.",
                      },
                      {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            errorMessage: "The 'name' field must be a string.",
                          },
                          browser_cache_settings_maximum_ttl: {
                            type: 'number',
                            nullable: true,
                            errorMessage:
                              "The 'browser_cache_settings_maximum_ttl' field must be a number or null.",
                          },
                          cdn_cache_settings_maximum_ttl: {
                            type: 'number',
                            nullable: true,
                            errorMessage:
                              "The 'cdn_cache_settings_maximum_ttl' field must be a number or null.",
                          },
                        },
                        required: ['name'],
                        additionalProperties: false,
                        errorMessage: {
                          additionalProperties:
                            'No additional properties are allowed in the cache object.',
                          required:
                            "The 'name' field is required in the cache object.",
                        },
                      },
                    ],
                    errorMessage:
                      "The 'cache' field must be either a string or an object with specified properties.",
                  },
                },
                additionalProperties: false,
                errorMessage: {
                  additionalProperties:
                    "No additional properties are allowed in the 'behavior' object.",
                },
              },
            },
            required: ['name', 'match'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                'No additional properties are allowed in request items.',
              required:
                "The 'name' and 'match' fields are required in each request item.",
            },
          },
        },
        response: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                errorMessage: "The 'name' field must be a string.",
              },
              description: {
                type: 'string',
                errorMessage: "The 'description' field must be a string.",
              },
              active: {
                type: 'boolean',
                default: true,
                errorMessage: "The 'active' field must be a boolean.",
              },
              match: {
                type: 'string',
                errorMessage: "The 'match' field must be a string.",
              },
              variable: {
                type: 'string',
                errorMessage: "The 'variable' field must be a string.",
              },
              behavior: {
                type: 'object',
                properties: {
                  setCookie: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'setCookie' field must be a string or null.",
                  },
                  setHeaders: {
                    type: 'array',
                    items: {
                      type: 'string',
                      errorMessage:
                        "Each item in 'setHeaders' must be a string.",
                    },
                    errorMessage: {
                      type: "The 'setHeaders' field must be an array of strings.",
                    },
                  },
                  deliver: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'deliver' field must be a boolean or null.",
                  },
                  capture: {
                    type: 'object',
                    properties: {
                      match: {
                        type: 'string',
                        errorMessage: "The 'match' field must be a string.",
                      },
                      captured: {
                        type: 'string',
                        errorMessage: "The 'captured' field must be a string.",
                      },
                      subject: {
                        type: 'string',
                        errorMessage: "The 'subject' field must be a string.",
                      },
                    },
                    required: ['match', 'captured', 'subject'],
                    additionalProperties: false,
                    errorMessage: {
                      additionalProperties:
                        "No additional properties are allowed in the 'capture' object.",
                      required:
                        "All properties ('match', 'captured', 'subject') are required in the 'capture' object.",
                    },
                  },
                  enableGZIP: {
                    type: ['boolean', 'null'],
                    errorMessage:
                      "The 'enableGZIP' field must be a boolean or null.",
                  },
                  filterCookie: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'filterCookie' field must be a string or null.",
                  },
                  filterHeader: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'filterHeader' field must be a string or null.",
                  },
                  runFunction: {
                    type: 'object',
                    properties: {
                      path: {
                        type: 'string',
                        errorMessage: "The 'path' field must be a string.",
                      },
                      name: {
                        type: ['string', 'null'],
                        errorMessage:
                          "The 'name' field can be a string or null.",
                      },
                    },
                    required: ['path'],
                    additionalProperties: false,
                    errorMessage: {
                      additionalProperties:
                        "No additional properties are allowed in the 'runFunction' object.",
                      required:
                        "The 'path' field is required in the 'runFunction' object.",
                    },
                  },
                  redirectTo301: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'redirectTo301' field must be a string or null.",
                  },
                  redirectTo302: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'redirectTo302' field must be a string or null.",
                  },
                },
                additionalProperties: false,
                errorMessage: {
                  additionalProperties:
                    "No additional properties are allowed in the 'behavior' object.",
                },
              },
            },
            required: ['name', 'match'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                'No additional properties are allowed in response items.',
              required:
                "The 'name' and 'match' fields are required in each response item.",
            },
          },
        },
      },
      anyOf: [
        {
          required: ['request'],
        },
        {
          required: ['response'],
        },
      ],
      additionalProperties: false,
      errorMessage: {
        additionalProperties:
          "No additional properties are allowed in the 'rules' object.",
        anyOf: "Either 'request' or 'response' must be provided.",
      },
    },
    networkList: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            errorMessage: "The 'id' field must be a number.",
          },
          listType: {
            type: 'string',
            errorMessage: "The 'listType' field must be a string.",
          },
          listContent: {
            type: 'array',
            items: {
              type: 'string',
              errorMessage:
                "The 'listContent' field must be an array of strings.",
            },
          },
        },
        required: ['id', 'listType', 'listContent'],
        additionalProperties: false,
        errorMessage: {
          additionalProperties:
            'No additional properties are allowed in network list items.',
          required:
            "The 'id, listType and listContent' fields are required in each network list item.",
        },
      },
    },
    domain: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          errorMessage: "The 'name' field must be a string.",
        },
        cnameAccessOnly: {
          type: 'boolean',
          errorMessage: "The 'cnameAccessOnly' field must be a boolean.",
        },
        cnames: {
          type: 'array',
          items: {
            type: 'string',
            errorMessage: "Each item in 'cnames' must be a string.",
          },
          errorMessage: {
            type: "The 'cnames' field must be an array of strings.",
          },
        },
        edgeApplicationId: {
          type: 'number',
          errorMessage: "The 'edgeApplicationId' field must be a number.",
        },
        edgeFirewallId: {
          type: 'number',
          errorMessage: "The 'edgeFirewallId' field must be a number.",
        },
        digitalCertificateId: {
          type: 'string',
          errorMessage: "The 'digitalCertificateId' field must be a string.",
        },
        mtls: {
          type: 'object',
          properties: {
            verification: {
              type: 'string',
              errorMessage: "The 'verification' field must be a string.",
            },
            trustedCaCertificateId: {
              type: 'number',
              errorMessage:
                "The 'trustedCaCertificateId' field must be a number.",
            },
            crlList: {
              type: 'array',
              items: {
                type: 'number',
                errorMessage: "Each item in 'crlList' must be a number.",
              },
              errorMessage: {
                type: "The 'crlList' field must be an array of numbers.",
              },
            },
          },
          required: ['verification', 'trustedCaCertificateId'],
          additionalProperties: false,
          errorMessage: {
            additionalProperties:
              'No additional properties are allowed in the mtls object.',
            required:
              "The 'verification and trustedCaCertificateId' fields are required in the mtls object.",
          },
        },
      },
      required: ['name'],
      additionalProperties: false,
      errorMessage: {
        type: "The 'domain' field must be an object.",
        additionalProperties:
          'No additional properties are allowed in the domain object.',
        required: "The 'name' field is required in the domain object.",
      },
    },
    purge: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['url', 'cachekeys', 'wildcard'],
            errorMessage:
              "The 'type' field must be either 'url', 'cachekeys' or 'wildcard'.",
          },
          urls: {
            type: 'array',
            items: {
              type: 'string',
              errorMessage: "Each item in 'urls' must be a string.",
            },
            errorMessage: {
              type: "The 'urls' field must be an array of strings.",
            },
          },
          method: {
            type: 'string',
            enum: ['delete'],
            errorMessage:
              "The 'method' field must be either 'delete'. Default is 'delete'.",
          },
          layer: {
            type: 'string',
            enum: ['edge_caching', 'l2_caching'],
            errorMessage:
              "The 'layer' field must be either 'edge_caching' or 'l2_caching'. Default is 'edge_caching'.",
          },
        },
        required: ['type', 'urls'],
        additionalProperties: false,
        errorMessage: {
          additionalProperties:
            'No additional properties are allowed in purge items.',
          required:
            "The 'type and urls' fields are required in each purge item.",
        },
      },
    },
  },
  required: [],
  additionalProperties: false,
  errorMessage: {
    additionalProperties:
      'No additional properties are allowed in the configuration object.',
    required: "The 'rules' section is required in the configuration object.",
  },
};

export default azionConfigSchema;
