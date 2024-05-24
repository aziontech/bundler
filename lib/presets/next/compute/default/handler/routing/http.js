import { applyPCREMatches } from './pcre.js';

/**
 *
 * @param {string} target Target that search params will be applied to.
 * @param {object} source Source search params to apply to the target.
 * @param {object} pcreMatch PCRE match object.
 */
function applyHeaders(target, source, pcreMatch) {
  const entries =
    source instanceof Headers ? source.entries() : Object.entries(source);

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    const newValue = pcreMatch?.match
      ? applyPCREMatches(value, pcreMatch.match, pcreMatch.captureGroupKeys)
      : value;

    if (lowerKey === 'set-cookie') {
      target.append(lowerKey, newValue);
    } else {
      target.set(lowerKey, newValue);
    }
  }
}

/**
 * Checks if a string is an URL.
 * @param {string} url String to check.
 * @returns {boolean} Whether the string is an URL.
 */
function isUrl(url) {
  return /^https?:\/\//.test(url);
}

/**
 * Merges search params from one URLSearchParams object to another.
 *
 * Only updates the a parameter if the target does not contain it, or the source value is not empty.
 * @param {string} target Target that search params will be applied to.
 * @param {string} source Source search params to apply to the target.
 */
function applySearchParams(target, source) {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of source.entries()) {
    if (!target.has(key) || !!value) {
      target.set(key, value);

      const paramMatch = /^nxtP(.+)$/.exec(key);
      if (paramMatch?.[1] && !target.has(paramMatch[1])) {
        target.set(paramMatch[1], value);
      }
    }
  }
}

/**
 * Creates a new Request object with the same body, headers, and search params as the original.
 *
 * Replaces the URL with the given path, stripping the `.html` extension and `/index.html` for
 * asset matching.
 * https://developers.cloudflare.com/pages/platform/serving-pages/#route-matching
 * @param {object} req Request object to re-create.
 * @param {string} path URL to use for the new Request object.
 * @returns {object} A new Request object with the same body and headers as the original.
 */
function createRouteRequest(req, path) {
  const newUrl = new URL(path, req.url);
  applySearchParams(newUrl.searchParams, new URL(req.url).searchParams);

  return new Request(newUrl, req);
}

/**
 * Creates a new Response object with the same body and headers as the original.
 *
 * Useful when the response object may be immutable.
 * @param {object} resp Response object to re-create.
 * @returns {object} A new Response object with the same body and headers.
 */
function createMutableResponse(resp) {
  return new Response(resp.body, resp);
}

/**
 * Parses the Accept-Language header value and returns an array of locales sorted by quality.
 *x
 * @param {string}headerValue Accept-Language header value.
 * @returns {Array}Array of locales sorted by quality.
 */
function parseAcceptLanguage(headerValue) {
  return headerValue
    .split(',')
    .map((val) => {
      const [lang, qual] = val.split(';');
      const quality = parseFloat((qual ?? 'q=1').replace(/q *= */gi, ''));

      return [lang.trim(), Number.isNaN(quality) ? 1 : quality];
    })
    .sort((a, b) => b[1] - a[1])
    .map(([locale]) => (locale === '*' || locale === '' ? [] : locale))
    .flat();
}

/* eslint-disable import/prefer-default-export */
/**
 * Adjusts the request so that it is formatted as if it were provided by Vercel
 * @param {object} request the original request received by the worker
 * @returns {object} The adjusted request to pass to Next
 */
function adjustRequestForVercel(request) {
  const adjustedHeaders = new Headers(request.headers);
  if (request.cf) {
    // TODO: replace cf geoip infos with azion metadata
    adjustedHeaders.append('x-vercel-ip-city', 'request.cf.city');
    adjustedHeaders.append('x-vercel-ip-country', 'request.cf.country');
    adjustedHeaders.append('x-vercel-ip-country-region', 'request.cf.region');
    adjustedHeaders.append('x-vercel-ip-latitude', 'request.cf.latitude');
    adjustedHeaders.append('x-vercel-ip-longitude', 'request.cf.longitude');
  }

  return new Request(request, { headers: adjustedHeaders });
}

export {
  applyHeaders,
  isUrl,
  applySearchParams,
  createRouteRequest,
  createMutableResponse,
  parseAcceptLanguage,
  adjustRequestForVercel,
};
