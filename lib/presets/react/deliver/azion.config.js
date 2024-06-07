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
        name: 'Set Storage Origin for All Requests',
        match: '^\\/',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
      },

      {
        name: 'Deliver Static Assets',
        match:
          '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
        deliver: true,
      },

      {
        name: 'Redirect to index.html',
        match: '^\\/',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: () => `/index.html`,
        },
      },
    ],
  },
};

export default AzionConfig;
