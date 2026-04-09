import fs from 'fs/promises';
import path from 'path';
import { feedback } from '@aziontech/utils/node';
import utils from '../utils';
import * as prettier from 'prettier';
import type { ReplaceOptions } from '../types';

/**
 * Finds the start and end of the configuration object in the file content
 * @param content - The file content
 * @returns Object with start and end positions of the config object
 */
function findConfigObjectBounds(content: string): { start: number; end: number } {
  // Use more specific regex patterns that match the actual code structure
  // This will avoid matching patterns inside comments

  // Look for export default defineConfig( at the beginning of a line (ignoring whitespace)
  const exportDefaultDefineConfigMatch = content.match(
    /^\s*export\s+default\s+defineConfig\s*\(\s*/m,
  );
  // Look for module.exports = defineConfig( at the beginning of a line
  const moduleExportsDefineConfigMatch = content.match(
    /^\s*module\.exports\s*=\s*defineConfig\s*\(\s*/m,
  );
  // Fallback patterns
  const exportDefaultMatch = content.match(/^\s*export\s+default\s+/m);
  const moduleExportsMatch = content.match(/^\s*module\.exports\s*=\s*/m);

  let objectStart = -1;

  // First, try to find patterns with defineConfig
  if (exportDefaultDefineConfigMatch) {
    objectStart = exportDefaultDefineConfigMatch.index! + exportDefaultDefineConfigMatch[0].length;
  } else if (moduleExportsDefineConfigMatch) {
    objectStart = moduleExportsDefineConfigMatch.index! + moduleExportsDefineConfigMatch[0].length;
  }
  // Fallback to regular patterns
  else if (exportDefaultMatch) {
    const startPos = exportDefaultMatch.index! + exportDefaultMatch[0].length;
    // Skip whitespace and look for defineConfig
    let i = startPos;
    while (i < content.length && content[i].match(/\s/)) {
      i++;
    }
    const defineConfigMatch = content.slice(i).match(/^defineConfig\s*\(\s*/);
    if (defineConfigMatch) {
      objectStart = i + defineConfigMatch[0].length;
    } else {
      objectStart = startPos;
    }
  } else if (moduleExportsMatch) {
    const startPos = moduleExportsMatch.index! + moduleExportsMatch[0].length;
    // Skip whitespace and look for defineConfig
    let i = startPos;
    while (i < content.length && content[i].match(/\s/)) {
      i++;
    }
    const defineConfigMatch = content.slice(i).match(/^defineConfig\s*\(\s*/);
    if (defineConfigMatch) {
      objectStart = i + defineConfigMatch[0].length;
    } else {
      objectStart = startPos;
    }
  }

  if (objectStart === -1) {
    throw new Error('Could not find module.exports or export default in config file');
  }

  // Find the opening brace/parenthesis first
  let i = objectStart;
  while (i < content.length && content[i].match(/\s/)) {
    i++; // Skip whitespace
  }

  if (i >= content.length) {
    throw new Error('Could not find opening brace or parenthesis for config object');
  }

  const openingChar = content[i];
  const closingChar = openingChar === '{' ? '}' : openingChar === '(' ? ')' : null;

  if (!closingChar) {
    throw new Error('Config object must start with { or (');
  }

  // Find the matching closing brace/parenthesis
  let count = 1; // Start with 1 because we found the opening char
  let inString = false;
  let stringChar = '';
  let objectEnd = content.length; // Default to end of content if not found

  for (let j = i + 1; j < content.length; j++) {
    const char = content[j];
    const prevChar = j > 0 ? content[j - 1] : '';

    // Handle string literals
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    if (inString) continue;

    // Count opening and closing chars
    if (char === openingChar) count++;
    else if (char === closingChar) count--;

    // Check if we've closed all braces/parentheses
    if (count === 0) {
      objectEnd = j + 1;
      break;
    }
  }

  return { start: objectStart, end: objectEnd };
}

/**
 * Finds and reads the azion config file, then performs a direct string replacement
 * only within the configuration object (module.exports or export default)
 * @param placeholder - The placeholder string to replace
 * @param value - The new value to replace the placeholder with
 */
export async function replaceInConfigFile(placeholder: string, value: string): Promise<void>;

/**
 * Finds and reads the azion config file, then performs multiple direct string replacements
 * only within the configuration object (module.exports or export default)
 * @param replacements - Array of placeholder-value pairs to replace
 */
export async function replaceInConfigFile(replacements: ReplaceOptions[]): Promise<void>;

/**
 * Implementation that handles both single and multiple replacements
 */
export async function replaceInConfigFile(
  placeholderOrReplacements: string | ReplaceOptions[],
  value?: string,
): Promise<void> {
  try {
    // Normalize input to always be an array of replacements
    const replacements: ReplaceOptions[] = Array.isArray(placeholderOrReplacements)
      ? placeholderOrReplacements
      : [{ placeholder: placeholderOrReplacements, value: value! }];

    // Validate all replacements
    for (const { placeholder, value: val } of replacements) {
      if (typeof placeholder !== 'string' || typeof val !== 'string') {
        throw new Error('Placeholder and value must be strings');
      }
    }

    const { configPath, fileContent } = await utils.findAndReadConfigFile();

    // Find the bounds of the configuration object
    const { start, end } = findConfigObjectBounds(fileContent);

    // Extract the configuration part
    const beforeConfig = fileContent.slice(0, start);
    let configPart = fileContent.slice(start, end);
    const afterConfig = fileContent.slice(end);

    // Track actual replacements made
    const replacementCounts: Map<string, number> = new Map();

    // Process each replacement
    for (const { placeholder, value: val } of replacements) {
      let count = 0;
      // Perform exact string replacement with strict word boundaries
      let searchIndex = 0;
      while (searchIndex < configPart.length) {
        const index = configPart.indexOf(placeholder, searchIndex);
        if (index === -1) break;

        // Check if this is a complete word (not part of a larger identifier)
        const beforeChar = index > 0 ? configPart[index - 1] : '';
        const afterChar =
          index + placeholder.length < configPart.length
            ? configPart[index + placeholder.length]
            : '';
        // Check if this is an exact match - avoid partial replacements
        // For most cases, we want exact string matches within reasonable boundaries
        let isExactMatch = true;

        // Special case: if placeholder looks like an identifier (contains letters/numbers/underscore/$)
        // and we're in the middle of a larger identifier, skip it
        if (typeof placeholder === 'string' && placeholder.match(/[A-Za-z0-9_$]/)) {
          // Check if we're in the middle of a larger identifier
          const beforeIsIdentifierChar = beforeChar && beforeChar.match(/[A-Za-z0-9_$]/);
          const afterIsIdentifierChar = afterChar && afterChar.match(/[A-Za-z0-9_]/);

          // Skip if we're clearly in the middle of a larger identifier
          if (beforeIsIdentifierChar || afterIsIdentifierChar) {
            isExactMatch = false;
          }
        }

        if (isExactMatch) {
          // Replace this occurrence
          configPart =
            configPart.slice(0, index) + val + configPart.slice(index + placeholder.length);

          // Update search index to continue after the replacement
          searchIndex = index + val.length;
          count++;
        } else {
          // Skip this occurrence and continue searching
          searchIndex = index + 1;
        }
      }
      if (count > 0) {
        replacementCounts.set(placeholder, count);
      }
    }

    // Reconstruct the file
    const updatedContent = beforeConfig + configPart + afterConfig;
    let finalContent: string;
    try {
      finalContent = await prettier.format(updatedContent, {
        parser: 'babel',
        semi: false,
        singleQuote: true,
        trailingComma: 'none',
      });
    } catch {
      finalContent = updatedContent;
    }

    // Write the file back
    await fs.writeFile(configPath, finalContent, 'utf8');

    // Provide feedback for all replacements
    const totalReplacements = Array.from(replacementCounts.values()).reduce((sum, c) => sum + c, 0);

    if (totalReplacements === 0) {
      feedback.info(`No placeholders found to replace in ${path.basename(configPath)}`);
    } else if (replacementCounts.size === 1) {
      const [placeholder, count] = Array.from(replacementCounts.entries())[0];
      const replacement = replacements.find((r) => r.placeholder === placeholder);
      feedback.info(
        `Successfully replaced "${placeholder}" with "${replacement?.value}" (${count} occurrence${count > 1 ? 's' : ''}) in ${path.basename(configPath)}`,
      );
    } else {
      const summary = Array.from(replacementCounts.entries())
        .map(([placeholder, count]) => {
          const replacement = replacements.find((r) => r.placeholder === placeholder);
          return `"${placeholder}" -> "${replacement?.value}" (${count})`;
        })
        .join(', ');
      feedback.info(
        `Successfully replaced ${totalReplacements} occurrences of ${replacementCounts.size} placeholders (${summary}) in ${path.basename(configPath)}`,
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to replace in config file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
