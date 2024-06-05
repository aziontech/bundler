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
        name: 'Main_Rule',
        match: '^\\/',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
      },

      {
        name: 'Assets_Rule_1',
        match: '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4)$',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
        deliver: true,
      },

      {
        name: 'Index_Rewrite_1',
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
