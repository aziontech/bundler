import { AzionConfig } from 'azion/config';

type ConfigOptions = {
  key: string;
  value?: string | number | boolean | object | null;
  config?: AzionConfig;
};

/**
 * Tries to parse a value as JSON, returns the original value if parsing fails
 */
function tryParseJSON(value: string | number | boolean | object | null | undefined): unknown {
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
 * Creates a new property in the user's azion.config
 * @example
 * // Create a simple property
 * createConfig({
 *   key: 'build.preset',
 *   value: 'typescript'
 * });
 *
 * // Create an array element
 * createConfig({
 *   key: 'edgeApplications[0].name',
 *   value: 'My Application'
 * });
 */
export function createConfig(options: ConfigOptions): AzionConfig {
  const userConfig: AzionConfig = {};
  const keys = options.key.split('.');

  let current: Record<string, unknown> = userConfig;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);

    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);

      if (i === keys.length - 1) {
        // Last key - set the value
        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }
        (current[arrayKey] as unknown[])[index] = tryParseJSON(options.value);
      } else {
        // Not last key - create structure
        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }
        if (!(current[arrayKey] as unknown[])[index]) {
          (current[arrayKey] as unknown[])[index] = {};
        }
        current = (current[arrayKey] as unknown[])[index] as Record<string, unknown>;
      }
    } else {
      if (i === keys.length - 1) {
        // Last key - set the value
        current[key] = tryParseJSON(options.value);
      } else {
        // Not last key - create structure
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
    }
  }

  return userConfig;
}

/**
 * Updates an existing property in the user's azion.config
 * Throws an error if the property or its parent objects don't exist
 * @example
 * // Updates an existing property
 * updateConfig({
 *   key: 'build.preset',
 *   value: 'typescript',
 *   config: userConfig
 * });
 *
 * // Updates an existing array element
 * updateConfig({
 *   key: 'edgeApplications[0].name',
 *   value: 'My Application',
 *   config: userConfig
 * });
 */
export function updateConfig(options: ConfigOptions): AzionConfig {
  if (!options.config) {
    throw new Error('Config is required for update');
  }
  if (!options.value) {
    throw new Error('Value is required for update');
  }

  const userConfig = { ...options.config };

  // Use the same navigation logic as readConfig but for updating
  const pathParts = options.key.split('.').flatMap((part) => {
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      return [arrayMatch[1], parseInt(arrayMatch[2])];
    }
    return [part];
  });

  // Navigate through the path and update at the end
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = userConfig;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const nextPart = pathParts[i + 1];

    if (i === pathParts.length - 1) {
      // Last part - this is what we want to update
      if (typeof part === 'number') {
        // Updating an array index
        if (!Array.isArray(current)) {
          throw new Error(`Property is not an array`);
        }
        if (part >= current.length) {
          throw new Error(`Array index ${part} does not exist`);
        }
        current[part] = tryParseJSON(options.value);
      } else {
        // Updating a property
        if (!(part in current)) {
          throw new Error(`Property '${part}' does not exist`);
        }
        current[part] = tryParseJSON(options.value);
      }
      break;
    }

    // Not the last part - continue navigation
    if (typeof part === 'number') {
      // Current part is an array index
      if (!Array.isArray(current)) {
        throw new Error(`Property is not an array`);
      }
      if (!current[part]) {
        throw new Error(`Array index ${part} does not exist`);
      }
      current = current[part];
    } else {
      // Current part is a property
      if (!(part in current)) {
        throw new Error(`Property '${part}' does not exist`);
      }
      if (typeof nextPart === 'number') {
        // Next part is an array index
        if (!Array.isArray(current[part])) {
          throw new Error(`Property '${part}' is not an array`);
        }
        if (!(current[part] as unknown[])[nextPart]) {
          throw new Error(`Array index ${nextPart} does not exist in '${part}'`);
        }
        current = current[part];
        // Don't skip the next part here, let the next iteration handle the array index
      } else {
        current = current[part];
      }
    }
  }

  return userConfig;
}

/**
 * Gets a specific property from the user's azion.config
 * Throws an error if the property or its parent objects don't exist
 * @example
 * // Get a simple property
 * readConfig({
 *   key: 'build.preset',
 *   config: userConfig
 * });
 *
 * // Get an array element
 * readConfig({
 *   key: 'edgeApplications[0].name',
 *   config: userConfig
 * });
 */
export function readConfig(options: ConfigOptions): unknown {
  if (!options.config) {
    throw new Error('Config is required for read');
  }
  const userConfig = options.config;

  // Split the path into parts and process arrays
  const pathParts = options.key.split('.').flatMap((part) => {
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      return [arrayMatch[1], parseInt(arrayMatch[2])];
    }
    return [part];
  });

  // Navigate to the correct object
  let current: Record<string, unknown> = userConfig;
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const nextPart = pathParts[i + 1];

    if (typeof part === 'number') {
      // Current part is an array index
      if (!Array.isArray(current)) {
        throw new Error(`Property is not an array`);
      }
      if (!current[part]) {
        throw new Error(`Array index ${part} does not exist`);
      }
      current = current[part] as Record<string, unknown>;
    } else {
      // Current part is a property
      if (!(part in current)) {
        throw new Error(`Property '${part}' does not exist`);
      }
      if (typeof nextPart === 'number') {
        // Next part is an array index
        if (!Array.isArray(current[part])) {
          throw new Error(`Property '${part}' is not an array`);
        }
        if (!(current[part] as unknown[])[nextPart]) {
          throw new Error(`Array index ${nextPart} does not exist in '${part}'`);
        }
        current = (current[part] as unknown[])[nextPart] as Record<string, unknown>;
        i++; // Skip next item as it was already processed
      } else {
        current = current[part] as Record<string, unknown>;
      }
    }
  }

  return current;
}

/**
 * Deletes a specific property from the user's azion.config
 * Throws an error if the property or its parent objects don't exist
 * @example
 * // Delete a simple property
 * deleteConfig({
 *   key: 'build.preset',
 *   config: userConfig
 * });
 *
 * // Delete an array element
 * deleteConfig({
 *   key: 'edgeApplications[0].name',
 *   config: userConfig
 * });
 */
export function deleteConfig(options: ConfigOptions): AzionConfig {
  if (!options.config) {
    throw new Error('Config is required for delete');
  }
  const userConfig = { ...options.config };
  const keys = options.key.split('.');

  let current: Record<string, unknown> = userConfig;

  // Navigate to parent of target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);

    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);

      if (!current[arrayKey]) {
        throw new Error(`Property '${arrayKey}' does not exist`);
      }
      if (!Array.isArray(current[arrayKey])) {
        throw new Error(`Property '${arrayKey}' is not an array`);
      }
      if (index >= (current[arrayKey] as unknown[]).length) {
        throw new Error(`Array index ${index} does not exist in '${arrayKey}'`);
      }
      current = (current[arrayKey] as unknown[])[index] as Record<string, unknown>;
    } else {
      if (!current[key]) {
        throw new Error(`Property '${key}' does not exist`);
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  // Delete the target
  const lastKey = keys[keys.length - 1];
  const arrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/);

  if (arrayMatch) {
    const arrayKey = arrayMatch[1];
    const index = parseInt(arrayMatch[2]);

    if (!current[arrayKey]) {
      throw new Error(`Property '${arrayKey}' does not exist`);
    }
    if (!Array.isArray(current[arrayKey])) {
      throw new Error(`Property '${arrayKey}' is not an array`);
    }
    if (index >= (current[arrayKey] as unknown[]).length) {
      throw new Error(`Array index ${index} does not exist in '${arrayKey}'`);
    }
    (current[arrayKey] as unknown[]).splice(index, 1);
  } else {
    if (!(lastKey in current)) {
      throw new Error(`Property '${lastKey}' does not exist`);
    }
    delete current[lastKey];
  }

  return userConfig;
}
