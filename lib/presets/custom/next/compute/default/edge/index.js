/* eslint-disable no-param-reassign */

/**
 * Fixes the function contents in miscellaneous ways.
 *
 * Note: this function contains hacks which are quite brittle and should be improved ASAP.
 * @param content the original function's file content
 * @returns the updated/fixed content
 */
// eslint-disable-next-line import/prefer-default-export
export function fixFunctionContent(content) {
  content = content.replace(
    // reference: https://github.com/vercel/next.js/blob/2e7dfca362931be99e34eccec36074ab4a46ffba/packages/next/src/server/web/adapter.ts#L276-L282
    /(Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[\s\S]*?configurable:\s*)([^,}]*)(.*}\s*\))/gm,
    '$1true$3',
  );

  // TODO: check this replace
  // The workers runtime does not implement certain properties like `mode` or `credentials`.
  // Due to this, we need to replace them with null so that request deduping cache key generation will work.
  // reference: https://github.com/vercel/next.js/blob/canary/packages/next/src/compiled/react/cjs/react.shared-subset.development.js#L198
  content = content.replace(
    /(?:(JSON\.stringify\(\[\w+\.method\S+,)\w+\.mode(,\S+,)\w+\.credentials(,\S+,)\w+\.integrity(\]\)))/gm,
    '$1null$2null$3null$4',
  );

  return content;
}
