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
  // eslint-disable-next-line no-var
  var bundler: BundlerGlobals;
}
