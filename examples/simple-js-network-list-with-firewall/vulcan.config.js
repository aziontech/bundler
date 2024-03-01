export default {
  builder: "esbuild",
  entry: "main.js",
  preset: {
    name: "javascript",
    mode: "compute",
  },
  useOwnWorker: true,
};
