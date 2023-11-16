export default {
  transform: {
    // '^.+\\.(js|jsx)?$': 'babel-jest',
    '^.+\\.(t|j)s?$': '@swc/jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  testEnvironment: 'node',
};
