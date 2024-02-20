export default {
  transform: {
    '^.+\\.(js|jsx)?$': '@swc/jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  modulePathIgnorePatterns: ['<rootDir>/examples'],
  testEnvironment: 'node',
  globalSetup: '<rootDir>/jest.global.setup.js',
};
