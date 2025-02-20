import { relocateImportsAndRequires } from '#utils';
import { readFileSync, writeFileSync } from 'fs';
import { AzionBuild } from 'azion/config';

export const injectCode = (
  buildConfig: AzionBuild,
  codeToInject: string,
): void => {
  let content = readFileSync(buildConfig.entry, 'utf-8');
  content = `${codeToInject} ${content}`;
  content = relocateImportsAndRequires(content);
  writeFileSync(buildConfig.entry, content);
};
