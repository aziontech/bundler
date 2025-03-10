/**
 * Build command options received from CLI
 */
export interface BuildCommandOptions {
  /**
   * Build entry point path. Where the build process starts
   * @default './main.js' or './main.ts'
   */
  entry?: string;

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
