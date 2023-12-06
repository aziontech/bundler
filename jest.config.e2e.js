export default {
  transform: {
    '^.+\\.(js|jsx)?$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/jest.global.setup.js',
};
