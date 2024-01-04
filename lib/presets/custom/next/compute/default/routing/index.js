// this code is based on cf build next tool (https://github.com/cloudflare/next-on-pages)

// const { cookie, createPCRE } = require('./libs.js');
const { createPCRE } = require('./libs.js');

// const { parse } = cookie;
const { RoutesMatcher } = require('./routes-matcher.js');
const { runOrFetchBuildOutputItem } = require('./utils.js');

// pcre
// pcre-to-regexp converts a PCRE string to a regular expression. It also extracts the named
// capture group keys, which is useful for matching and replacing parameters.
// This is the same library used by Vercel in the build output, and is used here to ensure
// consistency and proper support.

/**
 * Checks if a value matches with a PCRE-compatible string, and extract the capture group keys.
 * @param expr PCRE-compatible string.
 * @param val String to check with the regular expression.
 * @param caseSensitive Whether the regular expression should be case sensitive.
 * @returns The result of the matcher and the named capture group keys.
 */
export function matchPCRE(expr, val, caseSensitive) {
  const flag = caseSensitive ? '' : 'i';
  const captureGroupKeys = [];

  const matcher = createPCRE(`%${expr}%${flag}`, captureGroupKeys);
  const match = matcher.exec(val);
  return { match, captureGroupKeys };
}

/**
 * Processes the value and replaced any matched parameters (index or named capture groups).
 * @param rawStr String to process.
 * @param match Matches from the PCRE matcher.
 * @param captureGroupKeys Named capture group keys from the PCRE matcher.
 * @returns The processed string with replaced parameters.
 */
export function applyPCREMatches(rawStr, match, captureGroupKeys) {
  return rawStr.replace(/\$([a-zA-Z0-9]+)/g, (_, key) => {
    const index = captureGroupKeys.indexOf(key);
    // If the extracted key does not exist as a named capture group from the matcher, we can
    // reasonably assume it's a number and return the matched index. Fallback to an empty string.
    return (index === -1 ? match[parseInt(key, 10)] : match[index + 1]) || '';
  });
}

// http
/**
 *
 * @param target
 * @param source
 * @param pcreMatch
 */
export function applyHeaders(target, source, pcreMatch) {
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
 * @param url String to check.
 * @returns Whether the string is an URL.
 */
export function isUrl(url) {
  return /^https?:\/\//.test(url);
}

/**
 * Merges search params from one URLSearchParams object to another.
 *
 * Only updates the a parameter if the target does not contain it, or the source value is not empty.
 * @param target Target that search params will be applied to.
 * @param source Source search params to apply to the target.
 */
export function applySearchParams(target, source) {
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
 * @param req Request object to re-create.
 * @param path URL to use for the new Request object.
 * @returns A new Request object with the same body and headers as the original.
 */
export function createRouteRequest(req, path) {
  const newUrl = new URL(path, req.url);
  applySearchParams(newUrl.searchParams, new URL(req.url).searchParams);

  return new Request(newUrl, req);
}

/**
 * Creates a new Response object with the same body and headers as the original.
 *
 * Useful when the response object may be immutable.
 * @param resp Response object to re-create.
 * @returns A new Response object with the same body and headers.
 */
export function createMutableResponse(resp) {
  return new Response(resp.body, resp);
}

/**
 * Parses the Accept-Language header value and returns an array of locales sorted by quality.
 *x
 * @param headerValue Accept-Language header value.
 * @returns Array of locales sorted by quality.
 */
export function parseAcceptLanguage(headerValue) {
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

// matcher
/**
 * Checks if a Vercel source route's `has` record conditions match a request.
 * @param has The `has` record conditions to check against the request.
 * @param requestProperties The request properties to check against.
 * @param requestProperties.url
 * @param requestProperties.cookies
 * @param requestProperties.headers
 * @returns Whether the request matches the `has` record conditions.
 */
// eslint-disable-next-line consistent-return
export function hasField(has, { url, cookies, headers }) {
  // eslint-disable-next-line default-case
  switch (has.type) {
    case 'host': {
      return url.hostname === has.value;
    }
    case 'header': {
      if (has.value !== undefined) {
        return !!headers.get(has.key)?.match(has.value);
      }

      return headers.has(has.key);
    }
    case 'cookie': {
      const cookie = cookies[has.key];

      if (has.value !== undefined) {
        return !!cookie?.match(has.value);
      }

      return cookie !== undefined;
    }
    case 'query': {
      if (has.value !== undefined) {
        return !!url.searchParams.get(has.key)?.match(has.value);
      }

      return url.searchParams.has(has.key);
    }
  }
}

// request
/**
 * Adjusts the request so that it is formatted as if it were provided by Vercel
 * @param request the original request received by the worker
 * @returns the adjusted request to pass to Next
 */
export function adjustRequestForVercel(request) {
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

/**
 * Finds a match for the request.
 * @param matcher Instance of the matcher for the request.
 * @param phase The phase to run, either `none` or `error`.
 * @param skipErrorMatch Whether to skip the error match.
 * @returns The matched set of path, status, headers, and search params.
 */
export async function findMatch(
  matcher,
  phase = 'none',
  skipErrorMatch = false,
) {
  const result = await matcher.run(phase);

  if (
    result === 'error' ||
    (!skipErrorMatch && matcher.status && matcher.status >= 400)
  ) {
    return findMatch(matcher, 'error', true);
  }

  return {
    path: matcher.path,
    status: matcher.status,
    headers: matcher.headers,
    searchParams: matcher.searchParams,
    body: matcher.body,
  };
}

/**
 * Serves a file from the Vercel build output.
 * @param reqCtx Request Context object.
 * @param match The match from the Vercel build output.
 * @param match.path
 * @param match.status
 * @param match.headers
 * @param match.searchParams
 * @param match.body
 * @param output
 * @returns A response object.
 */
export async function generateResponse(
  reqCtx,
  { path = '/404', status, headers, searchParams, body },
  output,
) {
  // Redirect user to external URL for redirects.
  const locationHeader = headers.normal.get('location');
  if (locationHeader) {
    // Apply the search params to the location header if it was not from middleware.
    // Middleware that returns a redirect will specify the destination, including any search params
    // that they want to include. Therefore, we should not be appending search params to those.
    if (locationHeader !== headers.middlewareLocation) {
      const paramsStr = [...searchParams.keys()].length
        ? `?${searchParams.toString()}`
        : '';
      headers.normal.set('location', `${locationHeader ?? '/'}${paramsStr}`);
    }

    return new Response(null, { status, headers: headers.normal });
  }

  let resp =
    body !== undefined
      ? // If we have a response body from matching, use it instead.
        new Response(body, { status })
      : await runOrFetchBuildOutputItem(output[path], reqCtx, {
          path,
          status,
          headers,
          searchParams,
        });

  const newHeaders = headers.normal;
  applyHeaders(newHeaders, resp.headers);
  applyHeaders(newHeaders, headers.important);

  resp = new Response(resp.body, {
    ...resp,
    status: status || resp.status,
    headers: newHeaders,
  });

  return resp;
}

/**
 * Handles a request by processing and matching it against all the routing phases.
 * @param reqCtx Request Context object (contains all we need in to know regarding the request in order to handle it).
 * @param config The processed Vercel build output config.
 * @param output Vercel build output.
 * @returns An instance of the router.
 */
export async function handleRequest(reqCtx, config, output) {
  const matcher = new RoutesMatcher(config.routes, output, reqCtx);
  const match = await findMatch(matcher);

  return generateResponse(reqCtx, match, output);
}

/**
 * Checks if a source route's matcher uses the regex format for locales with a trailing slash, where
 * the locales specified are known.
 *
 * Determines whether a matcher is in the format of `^//?(?:en|fr|nl)/(.*)`.
 * @param src Source route `src` regex value.
 * @param locales Known available locales.
 * @returns Whether the source route matches the regex for a locale with a trailing slash.
 */
export function isLocaleTrailingSlashRegex(src, locales) {
  const prefix = '^//?(?:';
  const suffix = ')/(.*)';

  if (!src.startsWith(prefix) || !src.endsWith(suffix)) {
    return false;
  }

  const foundLocales = src.slice(prefix.length, -suffix.length).split('|');
  return foundLocales.every((locale) => locale in locales);
}
