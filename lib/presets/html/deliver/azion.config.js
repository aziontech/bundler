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
    ],
  },
};

export default AzionConfig;
