import { applyHeaders, createMutableResponse } from './routing/http.js';

/**
 * Checks whether the given URL matches the given remote pattern from the Vercel build output
 * images configuration.
 *
 * https://vercel.com/docs/build-output-api/v3/configuration#images
 * @param {URL} url URL to check.
 * @param {object} pattern Remote pattern to match against.
 * @param {string} pattern.protocol protocol ("http" | "https")
 * @param {string} pattern.hostname Remote
 * @param {string} pattern.port Remote
 * @param {string} pattern.pathname Remote
 * @returns {boolean} Whether the URL matches the remote pattern.
 */
export function isRemotePatternMatch(
  url,
  { protocol, hostname, port, pathname },
) {
  // Protocol must match if defined.
  if (protocol && url.protocol.replace(/:$/, '') !== protocol) return false;
  // Hostname must match regexp.
  if (!new RegExp(hostname).test(url.hostname)) return false;
  // Port must match regexp if defined.
  if (port && !new RegExp(port).test(url.port)) return false;
  // Pathname must match regexp if defined.
  if (pathname && !new RegExp(pathname).test(url.pathname)) return false;
  // All checks passed.
  return true;
}

/**
 * Derives the properties to use for image resizing from the incoming request, respecting the
 * images configuration spec from the Vercel build output config.
 *
 * https://vercel.com/docs/build-output-api/v3/configuration#images
 * @param {Request} request Incoming request.
 * @param {object} config Images configuration from the Vercel build output.
 * @returns {object | undefined} Resizing properties if the request is valid, otherwise undefined.
 */
export function getResizingProperties(request, config) {
  if (request.method !== 'GET') return undefined;

  const { origin, searchParams } = new URL(request.url);

  const rawUrl = searchParams.get('url');
  const width = Number.parseInt(searchParams.get('w') ?? '', 10);
  // 75 is the default quality - https://nextjs.org/docs/app/api-reference/components/image#quality
  const quality = Number.parseInt(searchParams.get('q') ?? '75', 10);

  if (!rawUrl || Number.isNaN(width) || Number.isNaN(quality)) return undefined;
  if (!config?.sizes?.includes(width)) return undefined;
  if (quality < 0 || quality > 100) return undefined;

  const url = new URL(rawUrl, origin);

  // SVGs must be allowed by the config.
  if (url.pathname.endsWith('.svg') && !config?.dangerouslyAllowSVG) {
    return undefined;
  }

  const isRelative = rawUrl.startsWith('/') || rawUrl.startsWith('%2F');
  if (
    // Relative URL means same origin as deployment and is allowed.
    !isRelative &&
    // External image URL must be allowed by domains or remote patterns.
    !config?.domains?.includes(url.hostname) &&
    !config?.remotePatterns?.find((pattern) =>
      isRemotePatternMatch(url, pattern),
    )
  ) {
    return undefined;
  }

  const acceptHeader = request.headers.get('Accept') ?? '';
  const format = config?.formats
    ?.find((f) => acceptHeader.includes(f))
    ?.replace('image/', '');

  return {
    isRelative,
    imageUrl: url,
    options: { width, quality, format },
  };
}

/**
 * Formats the given response to match the images configuration spec from the Vercel build output
 * config.
 *
 * Applies headers for `Content-Security-Policy` and `Content-Disposition`, if defined in the config.
 *
 * https://vercel.com/docs/build-output-api/v3/configuration#images
 * @param {Response} resp Response to format.
 * @param {URL} imageUrl Image URL that was resized.
 * @param {object} config Images configuration from the Vercel build output.
 * @returns {Response} Formatted response.
 */
export function formatResp(resp, imageUrl, config) {
  const newHeaders = new Headers();

  if (config?.contentSecurityPolicy) {
    newHeaders.set('Content-Security-Policy', config.contentSecurityPolicy);
  }

  if (config?.contentDispositionType) {
    const fileName = imageUrl.pathname.split('/').pop();
    const contentDisposition = fileName
      ? `${config.contentDispositionType}; filename="${fileName}"`
      : config.contentDispositionType;

    newHeaders.set('Content-Disposition', contentDisposition);
  }

  if (!resp.headers.has('Cache-Control')) {
    // Fall back to the minimumCacheTTL value if there is no Cache-Control header.
    // https://vercel.com/docs/concepts/image-optimization#caching
    newHeaders.set(
      'Cache-Control',
      `public, max-age=${config?.minimumCacheTTL ?? 60}`,
    );
  }

  const mutableResponse = createMutableResponse(resp);
  applyHeaders(mutableResponse.headers, newHeaders);

  return mutableResponse;
}

/**
 * Handles image resizing requests.
 * @param {Request} request Incoming request.
 * @param {object} config Images configuration from the Vercel build output.
 * @param {object} config.buildOutput Output object from build process
 * @param {object} config.assetsFetcher Fetcher to make requests
 * @param {object} config.imagesConfig Nextjs image configs
 * @returns {Promise<Response>} Resized image response if the request is valid, otherwise a 400 response.
 */
export async function handleImageResizingRequest(
  request,
  { buildOutput, assetsFetcher, imagesConfig },
) {
  const opts = getResizingProperties(request, imagesConfig);

  if (!opts) {
    return new Response('Invalid image resizing request', { status: 400 });
  }

  const { isRelative, imageUrl } = opts;

  // TODO: implement proper image processing

  const imageReq = new Request(imageUrl, { headers: request.headers });
  const imageResp =
    isRelative && imageUrl.pathname in buildOutput
      ? await assetsFetcher.fetch(imageReq)
      : await fetch(imageReq);

  return formatResp(imageResp, imageUrl, imagesConfig);
}
