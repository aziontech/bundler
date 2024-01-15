/**
 * Checks if a Vercel source route's `has` record conditions match a request.
 * @param has The `has` record conditions to check against the request.
 * @param requestProperties The request properties to check against.
 * @param requestProperties.url
 * @param requestProperties.cookies
 * @param requestProperties.headers
 * @returns Whether the request matches the `has` record conditions.
 */
// eslint-disable-next-line consistent-return, import/prefer-default-export
function hasField(has, { url, cookies, headers }) {
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

/**
 * Finds a match for the request.
 * @param matcher Instance of the matcher for the request.
 * @param phase The phase to run, either `none` or `error`.
 * @param skipErrorMatch Whether to skip the error match.
 * @returns The matched set of path, status, headers, and search params.
 */
async function findMatch(matcher, phase = 'none', skipErrorMatch = false) {
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

export { hasField, findMatch };
