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
        match: '^/rewrite$',
        cache: 'mycache1',
        rewrite: {
          match: '^(./)([^/])$',
          set: (captured) => `/new/${captured[1]}`, // Rewrites /original/image.jpg to /new/image.jpg
        },
        setCookie: 'user=12345; Path=/; Secure',
        setHeaders: 'Cache-Control: no-cache',
        forwardCookies: true,
        // Rewrites URLs based on regex, sets cookies, headers, and forwards cookies
      },
      {
        name: 'staticContentRuleExample',
        match: '^/_statics/',
        setOrigin: {
          name: 'myneworigin',
          type: 'object_storage',
        },
        deliver: true,
        // Handles static content by setting a specific origin and delivering directly
      },
      {
        name: 'computeFunctionRuleExample',
        match: '^/compute/',
        runFunction: {
          path: '.edge/worker.js',
        },
        // Executes a serverless function for compute paths
      },
      {
        name: 'permanentRedirectRuleExample',
        match: '^/old-url$',
        redirectTo301: 'https://newsite.com/new-url',
        // Permanently redirects from an old URL to a new URL
      },
      {
        name: 'gzipCompressionRuleExample',
        match: '^/compress',
        enableGZIP: true,
        // Enables GZIP compression for specified paths
      },
      {
        name: 'apiHeaderRuleExample',
        match: '^/api',
        setHeaders: ['X-API-Version: 1', 'X-Frame-Options: deny'],
        // Sets multiple headers for API responses
      },
      {
        name: 'cookieSettingRuleExample',
        match: '^/check',
        setCookie: 'test=12345; Path=/; Secure; HttpOnly',
        // Sets a secure, HttpOnly cookie
      },
      {
        name: 'userCaptureRuleExample',
        match: '^/user/(.*)',
        capture: {
          regex: '^(.*)$',
          captured: 'user_id',
          subject: 'uri', // Captures the user ID from the URI
        },
        // Captures user ID from the URL using regex
      },
      {
        name: 'directCacheRuleExample',
        match: '^/some-path',
        cache: {
          name: 'cacheDinamico',
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
        // Directly sets caching policies within the rule
      },
      {
        name: 'bypassCacheRuleExample',
        match: '^/bypass',
        bypassCache: true,
        // Ensures data is always fetched fresh, bypassing any cache
      },
      {
        name: 'forceHttpsRuleExample',
        match: '^/secure-area',
        redirectHttps: true,
        // Redirects HTTP requests to HTTPS for secure areas
      },
      {
        name: 'UriRedirectExample',
        match: '.*', // Captures all URIs
        variable: 'uri', // Defines the variable to be captured
        capture: {
          match: '^(.*)$', // Captures the entire URI path
          captured: 'uri_path', // Name of the variable where the captured path will be stored
          subject: 'uri', // Indicates that the capture will be made on the 'uri' variable
        },
        redirectTo302: `https://example.com/%{uri_path}`, // Uses the captured path as part of the new URL
        filterCookie: 'original_uri_cookie', // Removes the original cookie to avoid conflicts or duplicate information
      },
    ],
    response: [
      {
        name: 'apiDataResponseRuleExample',
        match: '^/api/data',
        setHeaders: 'Content-Type: application/json',
        setCookie: 'session=abcdef; Path=/; HttpOnly',
        filterHeader: 'Server',
        filterCookie: 'tracking',
        enableGZIP: true,
        // Manages headers, cookies, and GZIP compression for API data responses
      },
      {
        name: 'userProfileRedirectRuleExample',
        match: '^/user/profile',
        redirectTo301: 'https://newsite.com/profile',
        // Redirects user profile requests to a new profile page URL
      },
      {
        name: 'temporaryPageRedirectRuleExample',
        match: '^/old-page',
        redirectTo302: 'https://newsite.com/new-page',
        // Temporarily redirects an old page to a new page URL
      },
      {
        name: 'computeResultFunctionRuleExample',
        match: '^/compute-result',
        runFunction: {
          path: '.edge/computeResult.js',
        },
        capture: {
          match: '^(.*)$',
          captured: 'full_path',
          subject: 'uri',
        },
        // Runs a function and captures full path from the URI for compute results
      },
    ],
  },
};
