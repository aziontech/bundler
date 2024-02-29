/* eslint-disable */
export default {
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
        maxAgeSeconds: 1000 * 5,
      },
      edge: {
        maxAgeSeconds: 1000,
      },
    },
  ],
  rules: {
    request: [
      {
        match: '/path:id',
        cache: {
          name: 'mycache3',
          stale: false,
          queryStringSort: false,
          methods: {
            post: false,
            options: false,
          },
          browser: {
            maxAgeSeconds: 1000 * 5,
          },
          edge: {
            maxAgeSeconds: 1000,
          },
        },
        rewrite: {
          match: '^(./)([^/])$',
          set: (captured) => `/${captured[0]}/${captured[1]}`,
        },
        setCookie: '',
        setHeaders: {},
      },
    ],
  },
};
