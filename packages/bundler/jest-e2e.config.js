export default {
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  modulePathIgnorePatterns: ['<rootDir>/examples'],
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[j]s?(x)'],
  globalSetup: '<rootDir>/jest.global.setup.js',
  transformIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/examples/'],
};
