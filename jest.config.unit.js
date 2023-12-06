export default {
  transform: {
    '^.+\\.(t|j)s?$': '@swc/jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  testEnvironment: 'node',
};
