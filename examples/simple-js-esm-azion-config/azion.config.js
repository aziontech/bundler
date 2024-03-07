export default {
  cache: [
    {
      name: 'mycache1',
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
        match: '/rewrite',
        cache: 'mycache1',
        rewrite: {
          match: '^(./)([^/])$',
          set: (captured) => `/new/${captured[1]}`, // /original/image.jpg -> /new/image.jpg
        },
        setCookie: '',
        setHeaders: '',
        forwardCookies: false,
      },
      {
        match: '/^/_statics/;', // start with /_statics
        setOrigin: {
          name: 'name',
          type: 'object_storage',
        },
      },
    ],
  },
};
