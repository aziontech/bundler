import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import { getAbsoluteDirPath } from 'azion/utils/node';
import os from 'os';

/** Namespace for bundler configuration */
export const BUNDLER_NAMESPACE = 'bundler';

export const DEFAULT_CONFIG_FILENAME = 'azion.config';
export const DEFAULT_DEV_WORKER_FILENAME = 'index.dev.js';

/** Build phases feedback messages */
export const BUILD_MESSAGES = {
  PREBUILD: {
    START: 'Starting prebuild...',
    SUCCESS: 'Prebuild completed successfully',
  },
  BUILD: {
    START: 'Starting build...',
    SUCCESS: 'Build completed successfully',
  },
} as const;

/** Default directories */
export const DIRECTORIES = {
  OUTPUT_BASE_PATH: '.edge',
  OUTPUT_FUNCTIONS_PATH: join('.edge', 'functions'),
  OUTPUT_STORAGE_PATH: join('.edge', 'storage'),
  OUTPUT_MANIFEST_PATH: join('.edge', 'manifest.json'),
} as const;

/** Default build configuration values */
export const BUILD_DEFAULTS = {
  POLYFILLS: true,
  WORKER: false,
  PRODUCTION: true,
  EXTENSION: 'js',
  PRESET: undefined,
  ENTRY: undefined,
  BUNDLER: undefined,
} as const;

/** Supported bundlers */
export const BUNDLERS = {
  DEFAULT: 'esbuild',
  WEBPACK: 'webpack',
  ESBUILD: 'esbuild',
} as const;

/** File patterns and extensions */
export const FILE_PATTERNS = {
  TEMP_FILE: (base: string, timestamp: string, ext: string) =>
    `azion-${base}-${timestamp}.temp.${ext}`,
  TEMP_PREFIX: 'azion-',
  TEMP_SUFFIX: '.temp.',
} as const;

export type BundlerType = (typeof BUNDLERS)[keyof typeof BUNDLERS];

/** Bundler configuration and paths */
export const BUNDLER = {
  NAMESPACE: 'bundler',
  MIN_NODE_VERSION: '18.0.0',
  CONFIG_FILENAME: 'azion.config',
  DEV_WORKER_FILENAME: 'index.dev.js',
  LIB_DIR: getAbsoluteDirPath(import.meta.url, 'bundler'),
  ARGS_PATH: 'azion/args.json',
  IS_DEBUG: process.env.DEBUG === 'true',
  TEMP_DIR: (projectID: string) => join(os.tmpdir(), '.azion', projectID),
  get ROOT_PATH() {
    return resolve(this.LIB_DIR, '.');
  },
  get PACKAGE_JSON() {
    return JSON.parse(readFileSync(`${this.ROOT_PATH}/package.json`, 'utf8'));
  },
  get VERSION() {
    return this.PACKAGE_JSON.version;
  },
} as const;
