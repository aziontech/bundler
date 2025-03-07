import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { transformSync } from 'esbuild';

// @ts-ignore - traverse tem um problema conhecido com ESM
const traverse = _traverse.default || _traverse;

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

  let functionBodyNodes: t.Statement[] = [];
  let hasDefaultExport = false;

  traverse(ast, {
    ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
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

export const transpileTypescript = (sourceCode: string): string => {
  const { code } = transformSync(sourceCode, {
    loader: 'ts',
    format: 'esm',
    target: 'esnext',
  });
  return code;
};
