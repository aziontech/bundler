import { processVercelOutput } from './process-mapping.js';

describe('process-mapping-service', () => {
  describe('processVercelOutput', () => {
    it('should process the config and build output correctly', () => {
      const inputtedConfig = {
        version: 3,
        routes: [
          { src: '/test-1', dest: '/test-2' },
          { src: '/use-middleware', middlewarePath: 'middleware' },
          { handle: 'filesystem' },
          { src: '/test-3', dest: '/test-4' },
          { handle: 'miss' },
          { src: '/test-2', dest: '/test-6' },
        ],
      };
      const inputtedAssets = ['/static/test.png'];
      const inputtedPrerendered = new Map();
      const inputtedFunctions = new Map([
        ['/middleware', '/ middleware/index.js'],
        ['/use-middleware', '/use-middleware/index.js'],
      ]);

      const processed = processVercelOutput(
        inputtedConfig,
        inputtedAssets,
        inputtedPrerendered,
        inputtedFunctions,
      );

      const expected = {
        vercelConfig: {
          version: 3,
          routes: {
            none: [
              { src: '/test-1', dest: '/test-2' },
              { src: '/use-middleware', middlewarePath: 'middleware' },
            ],
            filesystem: [{ src: '/test-3', dest: '/test-4' }],
            miss: [{ src: '/test-2', dest: '/test-6' }],
            rewrite: [],
            resource: [],
            hit: [],
            error: [],
          },
        },
        vercelOutput: new Map([
          ['/static/test.png', { type: 'static' }],
          [
            '/use-middleware',
            {
              entrypoint: '/use-middleware/index.js',
              type: 'function',
            },
          ],
          [
            'middleware',
            {
              entrypoint: '/middleware/index.js',
              type: 'middleware',
            },
          ],
        ]),
      };

      expect(Object.keys(processed).toString()).toEqual(
        Object.keys(expected).toString(),
      );
      expect(Object.keys(processed.vercelConfig).toString()).toEqual(
        Object.keys(expected.vercelConfig).toString(),
      );
      expect(Object.keys(processed.vercelOutput).toString()).toEqual(
        Object.keys(expected.vercelOutput).toString(),
      );
    });

    test('applies overrides from the config to the outputted functions', () => {
      const inputtedConfig = {
        version: 3,
        routes: [],
        overrides: {
          '404.html': { path: '404', contentType: 'text/html; charset=utf-8' },
          '500.html': { path: '500', contentType: 'text/html; charset=utf-8' },
          'index.html': {
            path: 'index',
            contentType: 'text/html; charset=utf-8',
          },
        },
      };
      const inputtedAssets = [
        '/404.html',
        '/500.html',
        '/index.html',
        '/test.html',
      ];
      const inputtedPrerendered = new Map();

      const inputtedFunctions = new Map([
        ['/azion-node-server', '/azion-node-server.js'],
      ]);

      const processed = processVercelOutput(
        inputtedConfig,
        inputtedAssets,
        inputtedPrerendered,
        inputtedFunctions,
      );

      const expected = {
        vercelConfig: {
          version: 3,
          routes: {
            none: [],
            filesystem: [],
            miss: [],
            rewrite: [],
            resource: [],
            hit: [],
            error: [],
          },
          overrides: {
            '404.html': {
              contentType: 'text/html; charset=utf-8',
              path: '404',
            },
            '500.html': {
              contentType: 'text/html; charset=utf-8',
              path: '500',
            },
            'index.html': {
              contentType: 'text/html; charset=utf-8',
              path: 'index',
            },
          },
        },
        vercelOutput: new Map([
          [
            '/404.html',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/404.html',
              type: 'override',
            },
          ],
          [
            '/500.html',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/500.html',
              type: 'override',
            },
          ],
          [
            '/index.html',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/index.html',
              type: 'override',
            },
          ],
          [
            '/test.html',
            {
              type: 'static',
            },
          ],
          ['/azion-node-server', { type: 'node', entrypoint: null }],
          [
            '/404',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/404.html',
              type: 'override',
            },
          ],
          [
            '/500',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/500.html',
              type: 'override',
            },
          ],
          [
            '/index',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/index.html',
              type: 'override',
            },
          ],
          [
            '/',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/index.html',
              type: 'override',
            },
          ],
        ]),
      };

      expect(processed).toEqual(expected);
    });

    test('applies prerendered routes to the outputted functions', () => {
      const inputtedConfig = {
        version: 3,
        routes: [],
        overrides: {
          '404.html': { path: '404', contentType: 'text/html; charset=utf-8' },
          '500.html': { path: '500', contentType: 'text/html; charset=utf-8' },
          'index.html': {
            path: 'index',
            contentType: 'text/html; charset=utf-8',
          },
        },
      };
      const inputtedAssets = [
        '/404.html',
        '/500.html',
        '/index.html',
        '/index.rsc',
        '/nested/(route-group)/foo.html',
      ];
      const inputtedPrerendered = new Map([
        [
          '/index.html',
          {
            relativePath: '/index.html',
            route: {
              path: '/index.html',
              headers: {
                vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch',
              },
              overrides: ['/index', '/'],
            },
          },
        ],
        [
          '/index.rsc',
          {
            relativePath: '/index.rsc',
            route: {
              path: '/index.rsc',
              headers: {
                'content-type': 'text/x-component',
                vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch',
              },
              overrides: [],
            },
          },
        ],
      ]);
      const inputtedFunctions = new Map([['/page', '/page/index.js']]);

      const processed = processVercelOutput(
        inputtedConfig,
        inputtedAssets,
        inputtedPrerendered,
        inputtedFunctions,
      );

      const expected = {
        vercelConfig: {
          version: 3,
          routes: {
            none: [],
            filesystem: [],
            miss: [],
            rewrite: [],
            resource: [],
            hit: [],
            error: [],
          },
          overrides: {
            '404.html': {
              contentType: 'text/html; charset=utf-8',
              path: '404',
            },
            '500.html': {
              contentType: 'text/html; charset=utf-8',
              path: '500',
            },
            'index.html': {
              contentType: 'text/html; charset=utf-8',
              path: 'index',
            },
          },
        },
        vercelOutput: new Map([
          [
            '/404.html',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/404.html',
              type: 'override',
            },
          ],
          [
            '/500.html',
            {
              headers: { 'content-type': 'text/html; charset=utf-8' },
              path: '/500.html',
              type: 'override',
            },
          ],
          [
            '/index.html',
            { type: 'override', path: '/index.html', headers: undefined },
          ],
          [
            '/index.rsc',
            { type: 'override', path: '/index.rsc', headers: undefined },
          ],
          ['/nested/(route-group)/foo.html', { type: 'static' }],
          ['/page', { type: 'function', entrypoint: '/page/index.js' }],
          [
            '/404',
            {
              type: 'override',
              path: '/404.html',
              headers: { 'content-type': 'text/html; charset=utf-8' },
            },
          ],
          [
            '/500',
            {
              type: 'override',
              path: '/500.html',
              headers: { 'content-type': 'text/html; charset=utf-8' },
            },
          ],
          [
            '/index',
            {
              type: 'override',
              path: '/index.html',
              headers: { 'content-type': 'text/html; charset=utf-8' },
            },
          ],
          [
            '/',
            {
              type: 'override',
              path: '/index.html',
              headers: { 'content-type': 'text/html; charset=utf-8' },
            },
          ],
        ]),
      };

      expect(processed).toEqual(expected);
    });
  });
});
