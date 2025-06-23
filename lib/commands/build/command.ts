import { readAzionConfig } from '#env';
import { build } from './build';
import { AzionConfig } from 'azion/config';
import type { BuildCommandOptions } from './types';
import { cleanDirectory, resolveConfigPriority } from './utils';
import { BUILD_CONFIG_DEFAULTS, DIRECTORIES, type BundlerType } from '#constants';

/**
 * Build Command - Comprehensive project building for edge deployment
 *
 * This command builds and optimizes your project for deployment on Azion's edge computing platform.
 * It handles module resolution, applies polyfills, and provides abstraction over popular bundlers
 * like esbuild and webpack with preset configurations for various frameworks.
 *
 * @description
 * The build command processes your source code through multiple phases:
 * 1. Preset resolution and configuration setup
 * 2. Handler/entry point resolution
 * 3. Worker setup and runtime injection
 * 4. Prebuild hooks execution
 * 5. Core bundling with esbuild/webpack
 * 6. Postbuild hooks execution
 * 7. Environment setup and manifest generation
 *
 * @examples
 *
 * === BASIC BUILDS ===
 *
 * # Build JavaScript project (auto-detects main.js/main.ts)
 * ef build
 *
 * # Build TypeScript project
 * ef build -p typescript
 * ef build --preset typescript
 *
 * # Build with custom entry point
 * ef build -e ./src/app.js
 * ef build --entry ./src/index.ts
 *
 * # Build multiple entry points
 * ef build -e ./src/main.js ./src/worker.js ./src/api.js
 *
 * === FRAMEWORK BUILDS ===
 *
 * # React application
 * ef build -p react
 *
 * # Next.js application
 * ef build -p next
 *
 * # Vue.js application
 * ef build -p vue
 *
 * # Nuxt.js application
 * ef build -p nuxt
 *
 * # Astro application
 * ef build -p astro
 *
 * # Angular application
 * ef build -p angular
 *
 * # Svelte application
 * ef build -p svelte
 *
 * # Gatsby application
 * ef build -p gatsby
 *
 * # Static HTML sites
 * ef build -p html
 *
 * === BUILD OPTIONS ===
 *
 * # Development build (faster, includes source maps)
 * ef build -d
 * ef build --dev
 * ef build -p react -d
 *
 * # Production build (default, optimized)
 * ef build -p typescript
 *
 * # Enable Node.js polyfills (default: enabled)
 * ef build --polyfills
 * ef build --polyfills=true
 *
 * # Disable Node.js polyfills
 * ef build --polyfills=false
 *
 * # Enable worker mode (addEventListener signature)
 * ef build -w
 * ef build --worker
 * ef build -p javascript -w
 *
 * # Disable worker mode (default)
 * ef build --worker=false
 *
 * # Enable experimental features
 * ef build -x
 * ef build --experimental
 * ef build -p react -x
 *
 * === ADVANCED EXAMPLES ===
 *
 * # Full configuration build
 * ef build -e ./src/main.ts -p typescript -d -w -x
 *
 * # Multi-entry TypeScript build for production
 * ef build -e ./src/api.ts ./src/auth.ts -p typescript
 *
 * # React with worker mode and experimental features
 * ef build -p react -w -x --polyfills=false
 *
 * # Custom entry with development optimizations
 * ef build -e ./custom-entry.js -d --experimental
 *
 * # Static site generation
 * ef build -p html -e ./public/index.html
 *
 * # Rust/WebAssembly build
 * ef build -p rustwasm -e ./src/lib.rs
 *
 * # Emscripten build
 * ef build -p emscripten -e ./src/main.c
 *
 * === INTEGRATION WITH OTHER COMMANDS ===
 *
 * # Build and test locally
 * ef build -p react && ef dev
 *
 * # Build with custom config first
 * ef config create -k "build.preset" -v "typescript"
 * ef config create -k "build.polyfills" -v "false"
 * ef build
 *
 * # Build and generate manifest
 * ef build -p next
 * ef manifest generate -e azion.config.js -o .edge
 *
 * @outputs
 * - .edge/ directory with optimized edge-ready code
 * - azion.config.js (if not exists) with preset configuration
 * - Bundle artifacts and source maps (in dev mode)
 * - Manifest files for Azion deployment
 *
 * @notes
 * - Automatic preset detection based on package.json dependencies
 * - Polyfills are applied via unjs/unenv for Node.js compatibility
 * - Worker mode adds addEventListener signature for edge functions
 * - Development builds include source maps and faster compilation
 * - All builds generate manifest files for Azion platform deployment
 * - Build cache is stored in temporary directories for performance
 * - Supports both ESM and CommonJS module systems
 *
 * @function buildCommand
 * @description A command to initiate the build process.
 * This command prioritizes parameters over .azion-bundler file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .azion-bundler file configuration.
 * If neither is available, it resorts to default configurations.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.ts',
 *   preset: 'typescript',
 *   polyfills: false,
 *   worker: true,
 *   bundler: 'webpack',
 * });
 */
export async function buildCommand(options: BuildCommandOptions) {
  const userConfig: AzionConfig = (await readAzionConfig()) || {};
  const { build: userBuildConfig } = userConfig;

  const resolvedBuildConfig = {
    preset: resolveConfigPriority({
      inputValue: options.preset,
      fileValue: userBuildConfig?.preset,
      defaultValue: BUILD_CONFIG_DEFAULTS.PRESET,
    }),
    entry: resolveConfigPriority({
      inputValue: options.entry,
      fileValue: userBuildConfig?.entry,
      defaultValue: BUILD_CONFIG_DEFAULTS.ENTRY,
    }),
    bundler: resolveConfigPriority<BundlerType>({
      inputValue: undefined,
      fileValue: userBuildConfig?.bundler,
      defaultValue: BUILD_CONFIG_DEFAULTS.BUNDLER,
    }),
    polyfills: resolveConfigPriority({
      inputValue: userBuildConfig?.polyfills,
      fileValue: options.polyfills,
      defaultValue: BUILD_CONFIG_DEFAULTS.POLYFILLS,
    }),
  };

  const config: AzionConfig = {
    ...userConfig,
    build: {
      ...resolvedBuildConfig,
      memoryFS: userConfig?.build?.memoryFS,
      extend: userConfig?.build?.extend,
    },
  };

  if (options.production) await cleanDirectory([DIRECTORIES.OUTPUT_BASE_PATH]);
  return build({
    config,
    options: {
      production: options.production,
      skipFrameworkBuild: options.skipFrameworkBuild,
    },
  });
}
