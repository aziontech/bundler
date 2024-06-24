export const requestBehaviors = {
  setOrigin: {
    transform: (value, payloadCDN) => {
      const origin = payloadCDN.origin.find(
        (o) => o.name === value.name && o.origin_type === value.type,
      );

      if (!origin) {
        throw new Error(
          `Rule setOrigin name '${value.name}' not found in the origin settings`,
        );
      } else if (origin.origin_type !== value.type) {
        throw new Error(
          `Rule setOrigin originType '${value.type}' does not match the origin settings`,
        );
      }

      return {
        name: 'set_origin',
        target: origin.name,
      };
    },
  },
  rewrite: {
    transform: (value) => {
      const behaviors = [];
      behaviors.push({
        name: 'rewrite_request',
        target: value,
      });
      return behaviors;
    },
  },
  deliver: {
    transform: () => ({
      name: 'deliver',
      target: null,
    }),
  },
  setCookie: {
    transform: (value) => ({
      name: 'add_request_cookie',
      target: value,
    }),
  },
  setHeaders: {
    transform: (value) =>
      value.map((header) => ({
        name: 'add_request_header',
        target: header,
      })),
  },
  setCache: {
    transform: (value, payloadCDN) => {
      if (typeof value === 'string') {
        return {
          name: 'set_cache_policy',
          target: value,
        };
      }
      if (typeof value === 'object') {
        const cacheSetting = {
          name: value.name,
          ...value,
        };
        payloadCDN.cache.push(cacheSetting);
        return {
          name: 'set_cache_policy',
          target: value.name,
        };
      }
      return undefined;
    },
  },
  forwardCookies: {
    transform: (value) => {
      if (value) {
        return {
          name: 'forward_cookies',
          target: null,
        };
      }
      return undefined;
    },
  },
  runFunction: {
    transform: (value) => ({
      name: 'run_function',
      target: value.path,
    }),
  },
  enableGZIP: {
    transform: (value) => {
      if (value) {
        return {
          name: 'enable_gzip',
          target: '',
        };
      }
      return undefined;
    },
  },
  bypassCache: {
    transform: (value) => {
      if (value) {
        return {
          name: 'bypass_cache_phase',
          target: null,
        };
      }
      return undefined;
    },
  },
  httpToHttps: {
    transform: (value) => {
      if (value) {
        return {
          name: 'redirect_http_to_https',
          target: null,
        };
      }
      return undefined;
    },
  },
  redirectTo301: {
    transform: (value) => ({
      name: 'redirect_to_301',
      target: value,
    }),
  },
  redirectTo302: {
    transform: (value) => ({
      name: 'redirect_to_302',
      target: value,
    }),
  },
  capture: {
    transform: (value) => ({
      name: 'capture_match_groups',
      target: {
        regex: value.match,
        captured_array: value.captured,
        subject: `\${${value.subject ?? 'uri'}}`,
      },
    }),
  },
  // Adicione mais comportamentos conforme necessário
};

export const responseBehaviors = {
  setCookie: {
    transform: (value) => ({
      name: 'set_cookie',
      target: value,
    }),
  },
  setHeaders: {
    transform: (value) =>
      value.map((header) => ({
        name: 'add_response_header',
        target: header,
      })),
  },
  enableGZIP: {
    transform: (value) => {
      if (value) {
        return {
          name: 'enable_gzip',
          target: '',
        };
      }
      return undefined;
    },
  },
  filterCookie: {
    transform: (value) => ({
      name: 'filter_response_cookie',
      target: value,
    }),
  },
  filterHeader: {
    transform: (value) => ({
      name: 'filter_response_header',
      target: value,
    }),
  },
  runFunction: {
    transform: (value) => ({
      name: 'run_function',
      target: value.path,
    }),
  },
  redirectTo301: {
    transform: (value) => ({
      name: 'redirect_to_301',
      target: value,
    }),
  },
  redirectTo302: {
    transform: (value) => ({
      name: 'redirect_to_302',
      target: value,
    }),
  },
  capture: {
    transform: (value) => ({
      name: 'capture_match_groups',
      target: {
        regex: value.match,
        captured_array: value.captured,
        subject: `\${${value.subject ?? 'uri'}}`,
      },
    }),
  },
  // Adicione mais comportamentos conforme necessário
};
