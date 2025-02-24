import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { readFileSync } from 'fs';
import { AzionBuild, AzionBuildPreset } from 'azion/config';

/**
 * Extracts the body of the default exported function in a given code string,
 * and combines it with the rest of the code outside the exported function.
 * The function declaration is removed, leaving only its body.
 */
export const getExportedFunctionBody = (inputCode: string): string => {
  const ast = parser.parse(inputCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  let functionBodyNodes = [];
  let hasDefaultExport = false;

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      hasDefaultExport = true;
      const { declaration } = path.node;

      if (t.isFunctionDeclaration(declaration)) {
        functionBodyNodes = declaration.body.body;
      }

      if (
        t.isFunctionExpression(declaration) ||
        t.isArrowFunctionExpression(declaration)
      ) {
        if (t.isBlockStatement(declaration.body)) {
          functionBodyNodes = declaration.body.body;
        }
      }

      if (t.isIdentifier(declaration)) {
        const binding = path.scope.getBinding(declaration.name);

        if (binding && binding.path.isVariableDeclarator()) {
          const { init } = binding.path.node;

          if (
            t.isFunctionExpression(init) ||
            t.isArrowFunctionExpression(init)
          ) {
            if (t.isBlockStatement(init.body)) {
              functionBodyNodes = init.body.body;
            }
          }
          binding.path.parentPath.remove();
        }

        if (binding && binding.path.isFunctionDeclaration()) {
          functionBodyNodes = binding.path.node.body.body;
          binding.path.remove();
        }
      }

      path.remove();
    },
  });

  if (!hasDefaultExport) {
    throw new Error(
      'No default exports were found for entrypoint in the provided code.',
    );
  }

  ast.program.body = [...ast.program.body, ...functionBodyNodes];
  const { code: modifiedCode } = generate(ast);
  return modifiedCode;
};

/**
 * Move requires and imports to file init while preserving comments.
 */
export const relocateImportsAndRequires = (entryContent: string): string => {
  const importRegex = /import\s+.*?from\s*['"](.*?)['"];?/g;
  const requireRegex = /(const\s+.*?=\s*require\(.*\).*);/g;

  const importsList = (entryContent.match(importRegex) || []).map(
    (match: string) => match,
  );
  const requiresList = (entryContent.match(requireRegex) || []).map(
    (match: string) => match,
  );

  let newCode = entryContent.replace(importRegex, '').replace(requireRegex, '');
  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
};

/**
 * Detects if a specific event listener exists in the code
 */
export const detectEventListener = (
  eventTarget: string,
  code: string,
): boolean => {
  const eventRegex = new RegExp(
    `addEventListener\\((['"]?)${eventTarget}\\1,`,
    'g',
  );
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
  const eventRegex = new RegExp(
    `addEventListener\\((['"]?)${eventTarget}\\1,`,
    'g',
  );
  return code.replace(eventRegex, `addEventListener("${newEvent}",`);
};

/**
 * Process the preset handler template and inject the necessary code
 */
export const mountServiceWorker = (
  preset: AzionBuildPreset,
  config: AzionBuild,
): string => {
  const handlerTemplate = preset.handler.toString();
  const handlerTemplateBody = getExportedFunctionBody(handlerTemplate);

  let newHandlerContent = config.worker
    ? `(async function() {
        ${handlerTemplateBody}
      })()`
    : handlerTemplate;

  if (
    preset.metadata.name === 'javascript' ||
    preset.metadata.name === 'typescript'
  ) {
    const handlerContent = readFileSync(config.entry, 'utf-8');
    const content = config.worker
      ? handlerContent
      : getExportedFunctionBody(handlerContent);
    newHandlerContent = newHandlerContent.replace('__JS_CODE__', content);

    const isFirewallEvent = detectEventListener('firewall', newHandlerContent);

    if (!config.worker && isFirewallEvent) {
      throw new Error('Firewall events are not supported in this context');
    }
  }

  return moveImportsToTopLevel(newHandlerContent);
};

export const moveImportsToTopLevel = (code: string): string => {
  const importRegex = /import\s+.*?from\s*['"](.*?)['"];?/g;
  const requireRegex = /(const\s+.*?=\s*require\(.*\).*);/g;

  const importsList = (code.match(importRegex) || []).map(
    (match: string) => match,
  );
  const requiresList = (code.match(requireRegex) || []).map(
    (match: string) => match,
  );

  let newCode = code.replace(importRegex, '').replace(requireRegex, '');
  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
};
