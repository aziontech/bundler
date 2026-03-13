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
    replacements?: string | Record<string, string>;
  };
};

export type ConfigOptions = {
  key: string;
  value?: string | number | boolean | object | null;
  config?: AzionConfig;
};

export type ReplaceOptions = {
  placeholder: string;
  value: string;
};
