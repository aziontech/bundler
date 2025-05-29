import type { AzionFunctionBinding } from 'azion/config';

export interface BundlerGlobals {
  root: string;
  package: Record<string, unknown>;
  debug: boolean;
  version: string;
  tempPath: string;
  argsPath: string;
  experimental: boolean;
  bindings?: AzionFunctionBinding;
}

declare global {
  // eslint-disable-next-line no-var
  var bundler: BundlerGlobals;
}
