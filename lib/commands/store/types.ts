import type { AzionFunction, AzionBucket } from 'azion/config';

export type StoreCommandAction = 'init' | 'destroy';

export interface StoreCommandConfig {
  preset?: string;
  entry?: string;
  bundler?: 'webpack' | 'esbuild';
  polyfills?: boolean;
  worker?: boolean;
  scope?: string;
  functions?: AzionFunction[];
  storage?: AzionBucket[];
}

export interface StoreCommandParams {
  command: StoreCommandAction;
  options: {
    config?: string | StoreCommandConfig;
    scope?: string;
  };
}
