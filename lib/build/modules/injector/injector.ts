import { relocateImportsAndRequires } from '#utils';
import { readFileSync, writeFileSync } from 'fs';
import { BuildConfig } from '../types/bundler';

export const injectCode = (buildConfig: BuildConfig, codeToInject: string): void => {
  let content = readFileSync(buildConfig.entry, 'utf-8');
  content = `${codeToInject} ${content}`;
  content = relocateImportsAndRequires(content);
  writeFileSync(buildConfig.entry, content);
};
