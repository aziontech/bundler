import { createPCRE } from './libs.js';

// pcre-to-regexp converts a PCRE string to a regular expression. It also extracts the named
// capture group keys, which is useful for matching and replacing parameters.
// This is the same library used by Vercel in the build output, and is used here to ensure
// consistency and proper support.

/**
 * Checks if a value matches with a PCRE-compatible string, and extract the capture group keys.
 * @param {string} expr PCRE-compatible string.
 * @param {string} val String to check with the regular expression.
 * @param {string} caseSensitive Whether the regular expression should be case sensitive.
 * @returns {object} The result of the matcher and the named capture group keys.
 */
function matchPCRE(expr, val, caseSensitive) {
  const flag = caseSensitive ? '' : 'i';
  const captureGroupKeys = [];

  const matcher = createPCRE(`%${expr}%${flag}`, captureGroupKeys);
  const match = matcher.exec(val);
  return { match, captureGroupKeys };
}

/**
 * Processes the value and replaced any matched parameters (index or named capture groups).
 * @param {string} rawStr String to process.
 * @param {string} match Matches from the PCRE matcher.
 * @param {Array} captureGroupKeys Named capture group keys from the PCRE matcher.
 * @returns {string} The processed string with replaced parameters.
 */
function applyPCREMatches(rawStr, match, captureGroupKeys) {
  const rawPath = rawStr.replace(/\$([a-zA-Z0-9]+)/g, (_, key) => {
    const index = captureGroupKeys.indexOf(key);

    // If the extracted key does not exist as a named capture group from the matcher, we can
    // reasonably assume it's a number and return the matched index. Fallback to an empty string.
    return (index === -1 ? match[parseInt(key, 10)] : match[index + 1]) || '';
  });
  // In some cases the path may have multiple slashes, so we need to normalize it.
  return rawPath.replace(/^(\/)+/, '/');
}

export { applyPCREMatches, matchPCRE };
