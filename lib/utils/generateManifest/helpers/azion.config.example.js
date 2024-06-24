export default {
  origin: [
    {
      name: 'myneworigin',
      type: 'object_storage',
      bucket: 'blue-courage',
      prefix: '0101010101001',
    },
  ],
  cache: [
    {
      name: 'mycache',
      stale: false,
      queryStringSort: false,
      methods: {
        post: false,
        options: false,
      },
      browser: {
        maxAgeSeconds: 1000 * 5, // 5000 seconds
      },
      edge: {
        maxAgeSeconds: 1000,
      },
    },
  ],
  rules: {
    request: [
      {
        name: 'rewriteRuleExample',
        description: 'Rewrite URLs, set cookies and headers, forward cookies.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/rewrite$',
        behavior: {
          setCache: 'mycache1',
          rewrite: `/new/%{captured[1]}`, // Rewrites /original/image.jpg to /new/image.jpg
          setCookie: 'user=12345; Path=/; Secure',
          setHeaders: 'Cache-Control: no-cache',
          forwardCookies: true,
        },
      },
      {
        name: 'staticContentRuleExample',
        description:
          'Handle static content by setting a specific origin and delivering directly.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/_statics/',
        behavior: {
          setOrigin: {
            name: 'myneworigin',
            type: 'object_storage',
          },
          deliver: true,
        },
      },
      {
        name: 'computeFunctionRuleExample',
        description: 'Executes a serverless function for compute paths.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/compute/',
        behavior: {
          runFunction: {
            path: '.edge/worker.js',
          },
        },
      },
      {
        name: 'permanentRedirectRuleExample',
        description: 'Permanently redirects from an old URL to a new URL.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/old-url$',
        behavior: {
          redirectTo301: 'https://newsite.com/new-url',
        },
      },
      {
        name: 'gzipCompressionRuleExample',
        description: 'Enables GZIP compression for specified paths.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/compress',
        behavior: {
          enableGZIP: true,
        },
      },
      {
        name: 'apiHeaderRuleExample',
        description: 'Sets multiple headers for API responses.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/api',
        behavior: {
          setHeaders: ['X-API-Version: 1', 'X-Frame-Options: deny'],
        },
      },
      {
        name: 'cookieSettingRuleExample',
        description: 'Sets a secure, HttpOnly cookie.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/check',
        behavior: {
          setCookie: 'test=12345; Path=/; Secure; HttpOnly',
        },
      },
      {
        name: 'userCaptureRuleExample',
        description: 'Captures user ID from the URL using regex.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/user/(.*)',
        behavior: {
          capture: {
            regex: '^(.*)$',
            captured: 'user_id',
            subject: 'uri',
          },
        },
      },
      {
        name: 'directCacheRuleExample',
        description: 'Directly sets caching policies within the rule.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/some-path',
        behavior: {
          setCache: {
            name: 'dynamicCache',
            stale: true,
            queryStringSort: true,
            methods: {
              post: true,
              options: true,
            },
            browser: {
              maxAgeSeconds: 3600, // 1 hour
            },
            edge: {
              maxAgeSeconds: 600, // 10 minutes
            },
          },
        },
      },
      {
        name: 'bypassCacheRuleExample',
        description:
          'Ensures data is always fetched fresh, bypassing any cache.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/bypass',
        behavior: {
          bypassCache: true,
        },
      },
      {
        name: 'forceHttpsRuleExample',
        description: 'Redirects HTTP requests to HTTPS for secure areas.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/secure-area',
        behavior: {
          httpToHttps: true,
        },
      },
      {
        name: 'UriRedirectExample',
        description: 'Uses the captured path as part of the new URL.',
        active: true,
        match: '.*', // Captures all URIs
        variable: 'uri', // Defines the variable to be captured
        behavior: {
          capture: {
            match: '^(.*)$', // Captures the entire URI path
            captured: 'uri_path', // Name of the variable where the captured path will be stored
            subject: 'uri', // Indicates that the capture will be made on the 'uri' variable
          },
          redirectTo302: `https://example.com/%{uri_path}`, // Uses the captured path as part of the new URL
          filterCookie: 'original_uri_cookie', // Removes the original cookie to avoid conflicts or duplicate information
        },
      },
    ],
    response: [
      {
        name: 'apiDataResponseRuleExample',
        description:
          'Manage headers, cookies, and GZIP compression for API data responses.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/api/data',
        behavior: {
          setHeaders: 'Content-Type: application/json',
          setCookie: 'session=abcdef; Path=/; HttpOnly',
          filterHeader: 'Server',
          filterCookie: 'tracking',
          enableGZIP: true,
        },
      },
      {
        name: 'userProfileRedirectRuleExample',
        description:
          'Redirects user profile requests to a new profile page URL.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/user/profile',
        behavior: {
          redirectTo301: 'https://newsite.com/profile',
        },
      },
      {
        name: 'computeResultFunctionRuleExample',
        description:
          'Runs a function and captures full path from the URI for compute results.',
        active: true,
        variable: 'uri', // Optional, defaults to 'uri' if not provided
        match: '^/compute-result',
        behavior: {
          runFunction: {
            path: '.edge/computeResult.js',
          },
          // This rule captures the full URI path and stores it in a variable named 'full_path_arr'.
          capture: {
            match: '^(.*)$', // The regular expression '^(.*)$' captures the entire URI path.
            captured: 'full_path_arr', // The result of the capture is stored in the variable 'full_path_arr'.
            subject: 'uri', // The capture is based on the value of the 'uri' variable.
          },
          // Permanently redirects to the first element captured in 'full_path_arr'.
          redirectTo301: '%{full_path_arr[0]}', // Uses the first element of the 'full_path_arr' array as part of the new URL.
        },
      },
      {
        name: 'userProfileRedirectRuleExample',
        description: 'Redirects user profile requests based on cookie value.',
        active: true,
        // eslint-disable-next-line no-template-curly-in-string
        variable: 'cookie_name', // Example using cookie value
        match: '^user-profile$', // Matches based on the cookie value
        behavior: {
          redirectTo301: 'https://newsite.com/profile',
        },
      },
      {
        name: 'temporaryPageRedirectRuleExample',
        description:
          'Temporarily redirects an old page based on query parameters.',
        active: true,
        // eslint-disable-next-line no-template-curly-in-string
        variable: 'args', // All query parameters
        match: '^old-page$', // Matches based on the presence of specific query parameters
        behavior: {
          redirectTo302: 'https://newsite.com/new-page',
        },
      },
    ],
  },
};
