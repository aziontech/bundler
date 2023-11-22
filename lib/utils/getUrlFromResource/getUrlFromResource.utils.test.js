import { URL, Request } from '@edge-runtime/primitives';
import getUrlFromResource from './getUrlFromResource.utils.js';

describe('getUrlFromResource', () => {
  it('should return a URL when passed a valid string', () => {
    const urlString = 'https://example.com/';
    const context = { Request, URL };
    const result = getUrlFromResource(context, urlString);
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe(urlString);
  });

  it('should return a URL when passed a Request object', () => {
    const request = new Request('https://example.com');
    const context = { Request, URL };
    const result = getUrlFromResource(context, request);
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe(request.url);
  });

  it('should return the same URL when passed a URL object', () => {
    const url = new URL('https://example.com');
    const context = { Request, URL };
    const result = getUrlFromResource(context, url);
    expect(result).toBe(url);
  });

  it('should throw an error when passed an invalid url', () => {
    const invalidInput = 'example.com'; // Invalid input (not a string, Request, or URL)
    const context = { Request, URL };
    expect(() => getUrlFromResource(context, invalidInput)).toThrow(
      'Invalid URL',
    );
  });

  it('should throw an error when passed an invalid input', () => {
    const invalidInput = 123; // Invalid input (not a string, Request, or URL)
    const context = { Request, URL };
    expect(() => getUrlFromResource(context, invalidInput)).toThrow(
      "Invalid resource input. 'resource' must be 'URL', 'Request' or 'string'.",
    );
  });
});
