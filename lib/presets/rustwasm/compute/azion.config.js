const AzionConfig = {
  rules: {
    request: [
      {
        name: 'Execute Edge Function',
        match: '^\\/',
        bahavior: {
          runFunction: {
            path: '.edge/worker.js',
          },
        },
      },
    ],
  },
};

export default AzionConfig;
