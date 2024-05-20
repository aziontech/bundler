const AzionConfig = {
  origin: [
    {
      name: 'origin-storage-default',
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        name: 'Assets_Rule_1',
        match: '^\\/_next\\/static\\/', // starts with '/_next/static/'
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
        deliver: true,
      },
      {
        name: 'Assets_Rule_2',
        match: '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4)$',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
        deliver: true,
      },
      {
        name: 'Compute_Rule',
        match: '^/',
        runFunction: {
          path: '.edge/worker.js',
        },
        forwardCookies: true,
      },
    ],
  },
};

export default AzionConfig;
