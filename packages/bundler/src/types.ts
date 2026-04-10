export interface BundlerGlobals {
  root: string;
  package: Record<string, unknown>;
  debug: boolean;
  version: string;
  tempPath: string;
  argsPath: string;
  experimental: boolean;
}

declare global {
  var bundler: BundlerGlobals;
}
