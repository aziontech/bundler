export interface BundlerGlobals {
  root: string;
  package: Record<string, unknown>;
  debug: boolean;
  version: string;
  tempPath: string;
  argsPath: string;
}

declare global {
  var bundler: BundlerGlobals;
}
