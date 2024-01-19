import mockFS from 'mock-fs';
import { Headers, Response, Request, URL } from '@edge-runtime/primitives';
import { expect } from '@jest/globals';
import fetchContext from './fetch.context.js';

describe('fetchContext', () => {
  it('should call the global fetch function for non-file URLs', async () => {
    const resource = 'https://example.com/api/data';
    const options = { method: 'GET' };
    const mockContext = {
      Headers,
      Response,
      Request,
      URL,
      RESERVED_FETCH: () => {
        const response = '{ "statusText": "Not Found"  }';
        return JSON.parse(response);
      },
    };

    const response = await fetchContext(mockContext, resource, options);

    expect(response.statusText).toBe('Not Found');
  });

  it('should return a response when the begin with file://', async () => {
    mockFS({
      '.edge': {
        '.env': '',
        storage: {
          data: { build: { 'file.js': "console.log('ops')" } },
        },
      },
    });

    const resource = 'file:///data/build/file.js';
    const options = { method: 'GET' };
    const mockContext = { Headers, Response };

    const response = await fetchContext(mockContext, resource, options);

    expect(response.headers.get('Content-Type')).toBe('application/javascript');
    expect(response.status).toBe(200);
    mockFS.restore();
  });
});
