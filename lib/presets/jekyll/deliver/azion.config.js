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
        bahavior: {
          setOrigin: {
            name: 'origin-storage-default',
            type: 'object_storage',
          },
        },
      },
      {
        name: 'Deliver Static Assets',
        match:
          '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
        bahavior: {
          setOrigin: {
            name: 'origin-storage-default',
            type: 'object_storage',
          },
          deliver: true,
        },
      },
      {
        name: 'Redirect to index.html',
        match: '.*/$',
        bahavior: {
          rewrite: {
            set: (uri) => `${uri}index.html`,
          },
        },
      },
      {
        name: 'Redirect to index.html for Subpaths',
        match: '^(?!.*\\/$)(?![\\s\\S]*\\.[a-zA-Z0-9]+$).*',
        bahavior: {
          rewrite: {
            set: (uri) => `${uri}/index.html`,
          },
        },
      },
    ],
  },
};

export default AzionConfig;
