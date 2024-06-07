const AzionConfig = {
  rules: {
    request: [
      {
        name: 'Execute Edge Function',
        match: '^\\/',
        runFunction: {
          path: '.edge/worker.js',
        },
      },
    ],
  },
};

export default AzionConfig;
