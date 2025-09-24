import fs from 'fs/promises';
import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';

/**
 * Tries to parse a value as JSON, returns the original value if parsing fails
 */
export function tryParseJSON(
  value: string | number | boolean | object | null | undefined,
): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  // Check if it looks like JSON (starts with { or [)
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    // If parsing fails, return the original string
    return value;
  }
}

/**
 * Finds and reads the azion config file, returning the file path and content
 * @returns Object with configPath and fileContent
 */
export async function findAndReadConfigFile(): Promise<{
  configPath: string;
  fileContent: string;
}> {
  const explorer = cosmiconfig('azion', {
    searchPlaces: [
      'azion.config.ts',
      'azion.config.mts',
      'azion.config.cts',
      'azion.config.js',
      'azion.config.mjs',
      'azion.config.cjs',
      'azion.config.json',
    ],
    loaders: {
      '.ts': TypeScriptLoader(),
      '.mts': TypeScriptLoader(),
      '.cts': TypeScriptLoader(),
    },
  });

  const result = await explorer.search();

  if (!result) {
    throw new Error('No azion config file found');
  }

  const configPath = result.filepath;
  const fileContent = await fs.readFile(configPath, 'utf8');

  return { configPath, fileContent };
}

export default {
  findAndReadConfigFile,
  tryParseJSON,
};
