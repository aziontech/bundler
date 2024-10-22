import { existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';

/**
 * Checks if the project is a TypeScript or JavaScript project.
 * @param {string} currentDir - The current directory.
 * @returns {Promise<string>} - A promise that resolves to the project type (javascript or typescript).
 */
const checkingProjectTypeJS = async (currentDir = process.cwd()) => {
  const tsConfigPath = join(currentDir, 'tsconfig.json');
  const tsConfigExist = existsSync(tsConfigPath);
  if (tsConfigExist) {
    return 'typescript';
  }

  const files = readdirSync(currentDir);
  const hasTypeScriptFiles = files.some((file) =>
    ['.ts', '.tsx'].includes(extname(file)),
  );
  if (hasTypeScriptFiles) {
    return 'typescript';
  }

  return 'javascript';
};

export default checkingProjectTypeJS;
