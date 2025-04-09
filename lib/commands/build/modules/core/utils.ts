import type { BuildConfiguration, BuildContext } from 'azion/config';

/**
 * Move requires and imports to file init while preserving comments.
 */
export const relocateImportsAndRequires = (entryContent: string): string => {
  const importRegex = /import\s+.*?from\s*['"](.*?)['"];?/g;
  const requireRegex = /(const\s+.*?=\s*require\(.*\).*);/g;

  const importsList = (entryContent.match(importRegex) || []).map((match: string) => match);
  const requiresList = (entryContent.match(requireRegex) || []).map((match: string) => match);

  let newCode = entryContent.replace(importRegex, '').replace(requireRegex, '');
  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
};

/**
 * Detects if a specific event listener exists in the code
 */
export const detectEventListener = (eventTarget: string, code: string): boolean => {
  const eventRegex = new RegExp(`addEventListener\\((['"]?)${eventTarget}\\1,`, 'g');
  return !!code.match(eventRegex);
};

/**
 * Replaces an event listener target with a new one
 */
export const replaceEventListener = (
  eventTarget: string,
  newEvent: string,
  code: string,
): string => {
  const eventRegex = new RegExp(`addEventListener\\((['"]?)${eventTarget}\\1,`, 'g');
  return code.replace(eventRegex, `addEventListener("${newEvent}",`);
};

export const moveImportsToTopLevel = (code: string): string => {
  const importRegex = /import\s+.*?from\s*['"](.*?)['"];?/g;
  const requireRegex = /(const\s+.*?=\s*require\(.*\).*);/g;

  const importsList = (code.match(importRegex) || []).map((match) => match.trim());
  const requiresList = (code.match(requireRegex) || []).map((match) => match.trim());

  let newCode = code
    .replace(importRegex, '')
    .replace(requireRegex, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n');

  if (importsList.length || requiresList.length) {
    newCode = `${[...importsList, ...requiresList].join('\n')}\n\n${newCode.trim()}`;
  }

  return newCode;
};

export const injectHybridFsPolyfill = (
  code: string,
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): string => {
  if (buildConfig.polyfills && ctx.production) {
    return `import SRC_NODE_FS from "node:fs";\n${code}`;
  }
  return code;
};
