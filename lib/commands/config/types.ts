import { AzionConfig } from 'azion/config';

export type ConfigCommandOptions = {
  command: 'create' | 'read' | 'update' | 'delete' | 'replace';
  options: {
    key?: string;
    value?:
      | string
      | number
      | boolean
      | object
      | null
      | (string | number | boolean | object | null)[];
    all?: boolean;
  };
};

export type ConfigOptions = {
  key: string;
  value?: string | number | boolean | object | null;
  config?: AzionConfig;
};
