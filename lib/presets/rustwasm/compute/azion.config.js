const AzionConfig = {
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        runFunction: {
          path: '.edge/worker.js',
        },
      },
    ],
  },
};

export default AzionConfig;
