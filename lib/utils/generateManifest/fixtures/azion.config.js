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
        name: 'name1',
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
        name: 'name2',
        match: '/^/_statics/;', // start with /_statics
        setOrigin: {
          name: 'name',
          type: 'object_storage',
        },
        deliver: true,
      },
      {
        name: 'name3',
        match: '/^compute/;', // start with /compute
        runFunction: {
          path: '.edge/worker.js',
        },
      },
    ],
  },
};
