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
