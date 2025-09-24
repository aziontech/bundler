import fs from 'fs/promises';
import path from 'path';
import * as utilsNode from 'azion/utils/node';
import utils from '../utils';
import * as prettier from 'prettier';

/**
 * Updates a property in the azion config file by directly manipulating the file content as text
 * @param key - The property key to update (e.g., 'build.preset', 'applications[0].name')
 * @param value - The new value to set
 */
export async function updateInConfigFile(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  try {
    const { configPath, fileContent } = await utils.findAndReadConfigFile();
    // Parse the key to understand the structure
    const updatedContent = updatePropertyInContent(fileContent, key, value);
    let finalContent: string;
    try {
      finalContent = await prettier.format(updatedContent, {
        parser: 'babel',
        semi: false,
        singleQuote: true,
        trailingComma: 'none',
      });
    } catch (prettierError) {
      // If prettier fails, use the content as-is
      finalContent = updatedContent;
    }
    // Write the file back
    await fs.writeFile(configPath, finalContent, 'utf8');

    utilsNode.feedback.info(
      `Successfully updated "${key}" to "${value}" in ${path.basename(configPath)}`,
    );
  } catch (error) {
    throw new Error(
      `Failed to update config file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Updates a property in the file content using regex-based text manipulation
 * @param content - The file content as string
 * @param key - The property key to update
 * @param value - The new value
 * @returns Updated file content
 */
function updatePropertyInContent(
  content: string,
  key: string,
  value: string | number | boolean,
): string {
  // New universal approach: normalize content and use simple string manipulation
  return updatePropertyUniversal(content, key, value);
}

/**
 * Universal property update that works with any key format
 */
function updatePropertyUniversal(
  content: string,
  key: string,
  value: string | number | boolean,
): string {
  const formattedValue = formatValue(value);

  // Normalize content by removing all line breaks and extra spaces
  const normalized = content.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ');

  // Extract the main object (module.exports = {...} or export default {...} or module.exports = defineConfig({...}) or export default defineConfig({...}))
  // We need to find the matching closing brace, not just the first one
  const startMatch = normalized.match(
    /(.*(?:module\.exports\s*=(?:\s+\w+\()?|export default(?:\s+\w+\()?)\s*)\{/,
  );
  if (!startMatch) {
    return content; // Can't parse, return original
  }

  const startIndex = startMatch[0].length;

  // Find the matching closing brace
  let braceCount = 1;
  let endIndex = startIndex;
  let inString = false;
  let stringChar = '';

  for (let i = startIndex; i < normalized.length && braceCount > 0; i++) {
    const char = normalized[i];

    if (!inString) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    } else if (char === stringChar && normalized[i - 1] !== '\\') {
      inString = false;
    }

    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }

  if (braceCount !== 0) {
    return content; // Unmatched braces
  }

  const objectContent = normalized.substring(startIndex, endIndex);

  // Parse the key to understand what we're updating
  const keyPath = parseKeyPath(key);

  // Update the object content
  const updatedObjectContent = updateInObjectContent(objectContent, keyPath, formattedValue);

  // Reconstruct the content using original formatting
  // Find the same positions in the original content
  const originalStartMatch = content.match(
    /(.*(?:module\.exports\s*=(?:\s+\w+\()?|export default(?:\s+\w+\()?)\s*)\{/s,
  );
  if (!originalStartMatch) {
    return content; // Fallback to original
  }

  const originalBeforeObj = originalStartMatch[1] + '{';
  const originalStartIndex = originalStartMatch[0].length;

  // Find the matching closing brace in original content
  let originalBraceCount = 1;
  let originalEndIndex = originalStartIndex;
  let originalInString = false;
  let originalStringChar = '';

  for (let i = originalStartIndex; i < content.length && originalBraceCount > 0; i++) {
    const char = content[i];

    if (!originalInString) {
      if (char === '"' || char === "'") {
        originalInString = true;
        originalStringChar = char;
      } else if (char === '{') {
        originalBraceCount++;
      } else if (char === '}') {
        originalBraceCount--;
      }
    } else if (char === originalStringChar && content[i - 1] !== '\\') {
      originalInString = false;
    }

    if (originalBraceCount === 0) {
      originalEndIndex = i;
      break;
    }
  }

  const originalAfterObj = '}' + content.substring(originalEndIndex + 1);

  // Reconstruct with original formatting preserved
  return originalBeforeObj + updatedObjectContent + originalAfterObj;
}

/**
 * Parse a key path like "build.preset" or "applications[1].name" into parts
 */
function parseKeyPath(key: string): Array<string | number> {
  const parts: Array<string | number> = [];
  let current = '';
  let i = 0;

  while (i < key.length) {
    const char = key[i];

    if (char === '.') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else if (char === '[') {
      if (current) {
        parts.push(current);
        current = '';
      }
      // Find the closing bracket
      i++;
      let indexStr = '';
      while (i < key.length && key[i] !== ']') {
        indexStr += key[i];
        i++;
      }
      parts.push(parseInt(indexStr));
    } else {
      current += char;
    }
    i++;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Update a property within object content using the parsed key path
 */
function updateInObjectContent(
  objectContent: string,
  keyPath: Array<string | number>,
  value: string,
): string {
  if (keyPath.length === 0) return objectContent;

  const [firstKey, ...restPath] = keyPath;

  if (typeof firstKey === 'string') {
    // Property access
    if (restPath.length === 0) {
      // Final property, update it
      const propertyRegex = new RegExp(`(${firstKey}\\s*:\\s*)([^,}]+)`);
      return objectContent.replace(propertyRegex, `$1${value}`);
    } else {
      // Need to go deeper into nested property
      const propertyMatch = objectContent.match(new RegExp(`(.*${firstKey}\\s*:\\s*)([^,}]+)(.*)`));
      if (propertyMatch) {
        const [, , propValue] = propertyMatch;

        if (propValue.trim().startsWith('{')) {
          // Nested object - need to find the complete object, not just until first }
          const objectStart = objectContent.indexOf(propValue.trim());
          if (objectStart === -1) {
            return objectContent; // Can't find object
          }

          // Find the matching closing brace
          let braceCount = 0;
          let inString = false;
          let stringChar = '';
          let objectEnd = -1;

          for (let i = objectStart; i < objectContent.length; i++) {
            const char = objectContent[i];

            if (!inString) {
              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
              } else if (char === '{') {
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  objectEnd = i;
                  break;
                }
              }
            } else if (char === stringChar && objectContent[i - 1] !== '\\') {
              inString = false;
            }
          }

          if (objectEnd === -1) {
            return objectContent; // No matching brace found
          }

          const fullObjectValue = objectContent.substring(objectStart, objectEnd + 1);
          const nestedContent = fullObjectValue.slice(1, -1); // Remove { }
          const updatedNested = updateInObjectContent(nestedContent, restPath, value);

          // Replace the full object in the object content
          const beforeObject = objectContent.substring(0, objectStart);
          const afterObject = objectContent.substring(objectEnd + 1);

          return beforeObject + `{ ${updatedNested} }` + afterObject;
        } else if (propValue.trim().startsWith('[')) {
          // Array
          // The propValue might not contain the complete array, we need to find the matching ]
          // Let's find the complete array content from the original objectContent
          const arrayStart = objectContent.indexOf(propValue.trim());
          if (arrayStart === -1) {
            return objectContent; // Can't find array
          }

          // Find the matching closing bracket
          let bracketCount = 0;
          let inString = false;
          let stringChar = '';
          let arrayEnd = -1;

          for (let i = arrayStart; i < objectContent.length; i++) {
            const char = objectContent[i];

            if (!inString) {
              if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
              } else if (char === '[') {
                bracketCount++;
              } else if (char === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  arrayEnd = i;
                  break;
                }
              }
            } else if (char === stringChar && objectContent[i - 1] !== '\\') {
              inString = false;
            }
          }

          if (arrayEnd === -1) {
            return objectContent; // No matching bracket found
          }

          const fullArrayValue = objectContent.substring(arrayStart, arrayEnd + 1);
          const arrayContent = fullArrayValue.slice(1, -1); // Remove [ ]

          const updatedArray = updateInArrayContent(arrayContent, restPath, value);

          // Replace the full array in the object content
          const beforeArray = objectContent.substring(0, arrayStart);
          const afterArray = objectContent.substring(arrayEnd + 1);

          return beforeArray + `[ ${updatedArray} ]` + afterArray;
        }
      }
    }
  } else if (typeof firstKey === 'number') {
    // Array index access
    return updateInArrayContent(objectContent, keyPath, value);
  }

  return objectContent;
}

/**
 * Update a property within array content
 */
function updateInArrayContent(
  arrayContent: string,
  keyPath: Array<string | number>,
  value: string,
): string {
  if (keyPath.length === 0) return arrayContent;

  const [index, ...restPath] = keyPath;

  if (typeof index !== 'number') return arrayContent;

  // Parse array items using a simpler approach
  const items = [];
  let i = 0;

  while (i < arrayContent.length) {
    // Skip whitespace
    while (i < arrayContent.length && /\s/.test(arrayContent[i])) {
      i++;
    }

    if (i >= arrayContent.length) break;

    // If we find a {, parse the complete object
    if (arrayContent[i] === '{') {
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      const objectStart = i;

      while (i < arrayContent.length) {
        const char = arrayContent[i];

        if (!inString) {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              // Complete object found
              const objectContent = arrayContent.substring(objectStart, i + 1);
              items.push(objectContent.trim());
              i++; // Move past the }

              // Skip comma and whitespace
              while (i < arrayContent.length && /[\s,]/.test(arrayContent[i])) {
                i++;
              }
              break;
            }
          }
        } else if (char === stringChar && arrayContent[i - 1] !== '\\') {
          inString = false;
        }

        i++;
      }
    } else {
      // Handle non-object items (strings, numbers, etc.)
      const itemStart = i;
      let inString = false;
      let stringChar = '';

      while (i < arrayContent.length) {
        const char = arrayContent[i];

        if (!inString) {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === ',') {
            // End of item
            const itemContent = arrayContent.substring(itemStart, i);
            items.push(itemContent.trim());
            i++; // Move past comma

            // Skip whitespace
            while (i < arrayContent.length && /\s/.test(arrayContent[i])) {
              i++;
            }
            break;
          }
        } else if (char === stringChar && arrayContent[i - 1] !== '\\') {
          inString = false;
        }

        i++;
      }

      // Handle last item (no comma after it)
      if (i >= arrayContent.length && itemStart < arrayContent.length) {
        const itemContent = arrayContent.substring(itemStart);
        if (itemContent.trim()) {
          items.push(itemContent.trim());
        }
      }
    }
  }

  // Update the target item
  if (index < items.length) {
    if (restPath.length === 0) {
      // Replace entire item
      items[index] = value;
    } else {
      // Update property within item
      const item = items[index];
      if (item.startsWith('{') && item.endsWith('}')) {
        const itemContent = item.slice(1, -1); // Remove { }
        const updatedItem = updateInObjectContent(itemContent, restPath, value);
        items[index] = `{ ${updatedItem} }`;
      }
    }
  }

  return items.join(', ');
}

/**
 * Formats a value for JavaScript code
 */
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    // Check if it's already a quoted string
    if (value.startsWith('"') && value.endsWith('"')) {
      return value;
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value;
    }

    // Check if it's a JavaScript object/array (starts with { or [)
    const trimmed = value.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return value; // Return object as-is without quotes
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return value; // Return array as-is without quotes
    }

    // Check if it's a function (contains => or starts with function keyword)
    if (value.includes('=>') || value.trim().startsWith('function')) {
      return value;
    }

    // Everything else should be quoted (including paths, URLs, etc.)
    return `'${value}'`;
  }
  return String(value);
}
