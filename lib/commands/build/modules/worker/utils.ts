import { transformSync } from 'esbuild';

export const transpileTypescript = (sourceCode: string): string => {
  const { code } = transformSync(sourceCode, {
    loader: 'ts',
    format: 'esm',
    target: 'esnext',
  });
  return code;
};
