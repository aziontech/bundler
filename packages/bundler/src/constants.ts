import { getAbsoluteDirPath } from '@aziontech/utils/node';
import { readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

/** Default directories */
export const DIRECTORIES = {
  OUTPUT_BASE_PATH: '.edge',
  OUTPUT_FUNCTIONS_PATH: join('.edge', 'functions'),
  OUTPUT_STORAGE_PATH: join('.edge', 'storage'),
  OUTPUT_MANIFEST_PATH: join('.edge', 'manifest.json'),
  OUTPUT_ENV_VARS_PATH: join('.edge', '.env'),
  /**
   * Temporary workaround for Azion's global environment variables
   */
  OUTPUT_ENV_VARS_LOCAL_PATH: join('.edge', '.env.azion'),
  OUTPUT_STORAGE_METADATA_PATH: join('.edge', 'storage', 'metadata.json'),
  OUTPUT_KV_PATH: join('.edge', 'kv'),
} as const;

/** Default build configuration values */
export const BUILD_CONFIG_DEFAULTS = {
  POLYFILLS: true,
  WORKER: false,
  PRODUCTION: true,
  EXTENSION: 'js',
  PRESET: undefined,
  ENTRY: undefined,
  BUNDLER: undefined,
} as const;

/** Supported bundlers */
export const SUPPORTED_BUNDLERS = {
  DEFAULT: 'esbuild',
  WEBPACK: 'webpack',
  ESBUILD: 'esbuild',
} as const;

/** File patterns and extensions */
export const FILE_PATTERNS = {
  TEMP_FILE: (base: string, timestamp: string, ext: string) =>
    `azion-${base}-${timestamp}.temp.${ext}`,
  TEMP_PREFIX: 'azion-',
  TEMP_SUFFIX: '.temp',
} as const;

export type BundlerType = (typeof SUPPORTED_BUNDLERS)[keyof typeof SUPPORTED_BUNDLERS];

export const BUNDLER = {
  NAMESPACE: 'bundler',
  EXPERIMENTAL: false,
  MIN_NODE_VERSION: '18.0.0',
  CONFIG_FILENAME: 'azion.config',
  DEFAULT_HANDLER_FILENAME: 'handler',
  DEFAULT_DEV_WORKER_FILENAME: 'handler.dev',
  DEFAULT_OUTPUT_EXTENSION: 'js',
  LIB_DIR: getAbsoluteDirPath(import.meta.url, 'bundler'),
  ARGS_PATH: '@aziontech/args.json',
  IS_DEBUG: process.env.DEBUG === 'true',
  TEMP_DIR: (projectID: string) => join(tmpdir(), '.azion', projectID),
  get ROOT_PATH() {
    return resolve(BUNDLER.LIB_DIR, '.');
  },
  get PACKAGE_JSON() {
    return JSON.parse(readFileSync(`${BUNDLER.ROOT_PATH}/package.json`, 'utf8'));
  },
  get VERSION() {
    return BUNDLER.PACKAGE_JSON.version;
  },
} as const;

export const DOCS_MESSAGE = `

📚  Need help? Check out our documentation:
   - Azion CLI Documentation: https://www.azion.com/en/documentation/devtools/cli/build/
   - Azion Library on Github: https://github.com/aziontech/lib/tree/main/packages/config/
   - Azion Bundler on GitHub: https://github.com/aziontech/bundler\n`;

/**
 * Temporary workaround for Azion's global (non-project-scoped) environment variables.
 * Opt-in via `azbundler build --alias-env` (which sets AZ_BUNDLER_ENV_ALIAS_ENABLED). Off by
 * default so existing deploys built with plain env var names keep working unchanged.
 *
 * When enabled, on production builds the bundler reads the keys declared in the project's .env
 * file and rewrites `process.env.${KEY}` to `process.env.${PREFIX}${KEY}` in the compiled bundle
 * (via esbuild `define`). This lets a project store its values under a unique global name
 * (avoiding cross-project name collisions) while libraries keep reading the plain expected name.
 *
 * Remove once Azion supports project-scoped environment variables.
 */
export const ENV_ALIAS = {
  ENV_PREFIX_VAR: 'AZ_BUNDLER_ENV_ALIAS_PREFIX',
  ENABLE_VAR: 'AZ_BUNDLER_ENV_ALIAS_ENABLED',
} as const;

/** Telemetry configuration constants */
export const TELEMETRY = {
  ENV_ENABLED: 'AZ_BUNDLER_TELEMETRY',
  ENV_FORMAT: 'AZ_BUNDLER_TELEMETRY_FORMAT',
  ENV_OUTPUT: 'AZ_BUNDLER_TELEMETRY_OUTPUT',
  ENV_PLUGIN_DETAILS: 'AZ_BUNDLER_TELEMETRY_PLUGIN_DETAILS',
  DEFAULT_ENABLED: false,
  DEFAULT_FORMAT: 'both' as const,
  DEFAULT_OUTPUT_PATH: '.edge/telemetry-report.json',
  DEFAULT_HTML_OUTPUT_PATH: '.edge/telemetry-report.html',
  OUTPUT_FORMATS: ['console', 'json', 'html', 'both'] as const,
} as const;
