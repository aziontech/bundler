/* eslint-disable import/prefer-default-export */
/* eslint-disable no-param-reassign */

/**
 * Fixes the function contents in miscellaneous ways.
 *
 * Note: this function contains hacks which are quite brittle and should be improved ASAP.
 *
 * based on: https://github.com/cloudflare/next-on-pages/blob/main/packages/next-on-pages/src/buildApplication/processVercelFunctions/dedupeEdgeFunctions.ts#L462
 * @param {string} content the original function's file content
 * @returns {string} the updated/fixed content
 */
// eslint-disable-next-line import/prefer-default-export
//
function fixFunctionContent(content) {
  // TODO: Investigate alternatives or a real fix. This hack is rather brittle.
  // The workers runtime does not implement certain properties like `mode` or `credentials`.
  // Due to this, we need to replace them with null so that request deduping cache key generation will work.
  // https://github.com/vercel/next.js/blob/canary/packages/next/src/compiled/react/cjs/react.shared-subset.development.js#L198
  content = content.replace(
    /(?:(JSON\.stringify\(\[\w+\.method\S+,)\w+\.mode(,\S+,)\w+\.credentials(,\S+,)\w+\.integrity(\]\)))/gm,
    '$1null$2null$3null$4',
  );

  // The workers runtime does not implement `cache` on RequestInit. This is used in Next.js' patched fetch.
  // Due to this, we remove the `cache` property from those that Next.js adds to RequestInit.
  // https://github.com/vercel/next.js/blob/269114b5cc583f0c91e687c1aeb61503ef681b91/packages/next/src/server/lib/patch-fetch.ts#L304
  content = content.replace(
    /"cache",("credentials","headers","integrity","keepalive","method","mode","redirect","referrer")/gm,
    '$1',
  );

  // TODO: Remove once https://github.com/vercel/next.js/issues/58265 is fixed.
  // This resolves a critical issue in Next.js 14.0.2 that breaks edge runtime rendering due to the assumption
  // that the the passed internal request is of type `NodeNextRequest` and never `WebNextRequest`.
  content = content.replace(
    /;let{originalRequest:([\w$]+)}=([\w$]+);/gm,
    ';let{originalRequest:$1=$2}=$2;',
  );

  // middleware entries webpack problem
  content = content.replace(
    /let _ENTRIES = {};/gm,
    'globalThis._ENTRIES = {};',
  );

  // error socket undefined
  // https://github.com/vercel/next.js/blob/v14.2.6/packages/next/src/server/base-server.ts#L910
  content = content.replace(/\.socket/g, '?.socket');

  return content;
}

export { fixFunctionContent };
