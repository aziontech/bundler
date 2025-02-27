import type { JestConfigWithTsJest } from 'ts-jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: JestConfigWithTsJest = {
  displayName: 'Bundler',
  clearMocks: true,
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  testPathIgnorePatterns: ['node_modules/', '/examples/'],
  modulePathIgnorePatterns: ['<rootDir>/examples'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/examples/'],
};

export default config;
