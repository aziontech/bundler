module.exports = {
  builder: 'esbuild',
  memoryFS: {
    injectionDirs: ['data'],
    removePathPrefix: '',
  },
  useNodePolyfills: true,
};
