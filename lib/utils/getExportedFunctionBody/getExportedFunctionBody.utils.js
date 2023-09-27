import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

const traverse = _traverse.default;
const generate = _generate.default;

/**
 * Extracts the body of the default exported function in a given code string,
 * and combines it with the rest of the code outside the exported function.
 * The function declaration is removed, leaving only its body.
 * @param {string} inputCode - The source code as a string.
 * @returns {string} - The modified source code as a string.
 */
function getExportedFunctionBody(inputCode) {
  // Parse the input code to generate the AST.
  const ast = parser.parse(inputCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  let functionBodyNodes = [];

  // Traverse the AST to find the default exported function.
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const { declaration } = path.node;

      // If the exported default is a Function Declaration, extract its body.
      if (t.isFunctionDeclaration(declaration)) {
        functionBodyNodes = declaration.body.body;
      }

      // If the exported default is a Function or Arrow Function Expression, extract its body.
      if (
        t.isFunctionExpression(declaration) ||
        t.isArrowFunctionExpression(declaration)
      ) {
        functionBodyNodes = declaration.body.body;
      }

      // If the exported default is an Identifier, find the associated Variable Declarator and extract the body of the function it initializes.
      if (t.isIdentifier(declaration)) {
        const binding = path.scope.getBinding(declaration.name);

        if (binding && binding.path.isVariableDeclarator()) {
          const { init } = binding.path.node;

          if (
            t.isFunctionExpression(init) ||
            t.isArrowFunctionExpression(init)
          ) {
            functionBodyNodes = init.body.body;
          }
          // Remove the variable declaration associated with the exported identifier.
          binding.path.parentPath.remove();
        }

        // If the binding is a function declaration, remove it and extract its body.
        if (binding && binding.path.isFunctionDeclaration()) {
          functionBodyNodes = binding.path.node.body.body;
          binding.path.remove();
        }
      }

      // Remove the original export declaration.
      path.remove();
    },
  });

  // Add the nodes of the function body to the end of the program body.
  ast.program.body = [...ast.program.body, ...functionBodyNodes];

  // Generate the modified code from the modified AST.
  const { code: modifiedCode } = generate(ast);
  return modifiedCode;
}

export default getExportedFunctionBody;
