import { BundlerStore } from '#env';

export type StoreCommandAction = 'init' | 'destroy';

export interface StoreCommandParams {
  command: StoreCommandAction;
  options: {
    config?: string | BundlerStore;
    scope?: string;
  };
}
