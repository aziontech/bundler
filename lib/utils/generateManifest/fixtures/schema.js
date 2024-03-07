const azionConfigSchema = {
  type: 'object',
  properties: {
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
              match: {
                type: 'string',
                errorMessage: "The 'match' field must be a string.",
              },
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
                  bucket: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'bucket' field must be a string or null.",
                  },
                  prefix: {
                    type: ['string', 'null'],
                    errorMessage:
                      "The 'prefix' field must be a string or null.",
                  },
                },
                required: ['type'],
                additionalProperties: false,
                errorMessage: {
                  additionalProperties:
                    "No additional properties are allowed in the 'setOrigin' object.",
                  required:
                    "The 'type' field is required in the 'setOrigin' object.",
                },
              },
              rewrite: {
                type: 'object',
                properties: {
                  match: {
                    type: ['string', 'null'],
                    errorMessage: "The 'match' field must be a string or null.",
                  },
                  set: {
                    instanceof: 'Function',
                    errorMessage: "The 'set' field must be a function.",
                  },
                },
                required: ['set'],
                additionalProperties: false,
                errorMessage: {
                  additionalProperties:
                    "No additional properties are allowed in the 'rewrite' object.",
                  required:
                    "The 'set' field is required in the 'rewrite' object.",
                },
              },
              setHeaders: {
                type: ['string', 'null'],
                errorMessage:
                  "The 'setHeaders' field must be a string or null.",
              },
              forwardCookies: {
                type: ['boolean', 'null'],
                errorMessage:
                  "The 'forwardCookies' field must be a boolean or null.",
              },
              setCookie: {
                type: ['string', 'null'],
                errorMessage: "The 'setCookie' field must be a string or null.",
              },
              deliver: {
                type: ['boolean', 'null'],
                errorMessage: "The 'deliver' field must be a boolean or null.",
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
                    errorMessage: "The 'name' field can be a string or null.",
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
              cache: {
                oneOf: [
                  {
                    type: 'string',
                    errorMessage: "The 'cache' field must be a string.",
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
            required: ['match'],
            additionalProperties: false,
            errorMessage: {
              additionalProperties:
                'No additional properties are allowed in request items.',
              required: "The 'match' field is required in each request item.",
            },
          },
        },
      },
      required: ['request'],
      additionalProperties: false,
      errorMessage: {
        additionalProperties:
          "No additional properties are allowed in the 'rules' object.",
        required: "The 'request' array is required in the 'rules' object.",
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
  },
  required: [],
  additionalProperties: false,
  errorMessage: {
    additionalProperties:
      'No additional properties are allowed in the configuration object.',
    required: "The 'rules' section are required in the configuration object.",
  },
};

export default azionConfigSchema;
