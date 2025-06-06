export type ConfigCommandOptions = {
  command: 'create' | 'read' | 'update' | 'delete';
  options: {
    key?: string;
    value?: string | number | boolean | object | null;
    all?: boolean;
  };
};
