const azionConfigSchema = {
  type: 'object',
  properties: {
    origin: {
      type: 'array',
      items: {
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
            errorMessage: "The 'bucket' field must be a string or null.",
          },
          prefix: {
            type: ['string', 'null'],
            errorMessage: "The 'prefix' field must be a string or null.",
          },
          addresses: {
            type: 'array',
            items: {
              type: 'string',
              errorMessage: "The 'address' field must be a string.",
            },
          },
          hostHeader: {
            type: 'string',
            errorMessage: "The 'hostHeader' field must be a string.",
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
