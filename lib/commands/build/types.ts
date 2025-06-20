import { AzionConfig, BuildConfiguration, BuildContext, PresetInput } from 'azion/config';
/**
 * Build command options received from CLI
 */
export interface BuildCommandOptions {
  /**
   * Build entry point path. Where the build process starts
   * @default './main.js' or './main.ts'
   */
  entry?: string | string[];

  /**
   * Either a preset name from azion/presets or a custom module with edge-compatibility routines
   */
  preset?: string;

  /**
   * Automatically applies environment polyfills (using @unjs/unenv)
   * @default true
   */
  polyfills?: boolean;

  /**
   * Enables Worker syntax instead of ES modules
   * @default false
   */
  worker?: boolean;

  /**
   * Enables production mode with optimizations
   * @default true
   */
  production?: boolean;
}

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface ConfigValueOptions<T> {
  inputValue?: T;
  fileValue?: T;
  storeValue?: T;
  defaultValue?: T;
}

export interface PresetValueOptions {
  inputValue?: string;
  fileValue?: PresetInput;
  storeValue?: PresetInput;
  defaultValue?: string;
}
export interface BuildOptions {
  production?: boolean;
}

export interface BuildResult {
  config: AzionConfig;
  ctx: BuildContext;
  setup: BuildConfiguration;
}

export interface BuildParams {
  config: AzionConfig;
  options: BuildOptions;
}
