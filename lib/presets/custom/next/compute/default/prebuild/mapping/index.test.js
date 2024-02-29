import mockFs from 'mock-fs';
import { mapAndAdaptFunctions } from './index.js';

describe('mapping index.js', () => {
  test('Should generate functionsmap', async () => {
    mockFs({
      '.vercel': {
        output: {
          functions: {
            ssr: {
              '.vc-config.json':
                '{"operationType": "Page","handler": "___next_launcher.cjs","runtime": "nodejs18.x","environment": {},"supportsMultiPayloads": true,"framework": {"slug": "nextjs","version": "12.3.4"},"launcherType": "Nodejs","shouldAddHelpers": false,"shouldAddSourcemapSupport": false}',
            },
            ssredge: {
              'index.js': 'console.log("Hello World!")',
              '.vc-config.json':
                '{"runtime": "edge","name": "index","deploymentTarget": "v8-worker","entrypoint": "index.js","assets": [],"framework": {"slug": "nextjs","version": "13.0.0"}}',
            },
          },
        },
      },
    });

    const applicationMapping = {
      invalidFunctions: new Set(),
      functionsMap: new Map(),
      webpackChunks: new Map(),
      wasmIdentifiers: new Map(),
      prerenderedRoutes: new Map(),
    };

    const tmpFunctionsDir = '/tmp/azion-functions';
    await mapAndAdaptFunctions(applicationMapping, tmpFunctionsDir);
    expect(Array.from(applicationMapping.functionsMap.values())).toEqual([
      '/tmp/azion-functions/functions/azion-node-server.js',
      '/tmp/azion-functions/functions/ssredge.js',
    ]);

    mockFs.restore();
  });

  test('Should thow a error when found a invalid config', async () => {
    mockFs({
      '.vercel': {
        output: {
          functions: {
            ssr: {
              '.vc-config.json':
                '{"operationType": "Page","handler": "___next_launcher.cjs","runtime": "nodejs18.x","environment": {},"supportsMultiPayloads": true,"framework": {"slug": "nextjs","version": "14.3.4"},"launcherType": "Nodejs","shouldAddHelpers": false,"shouldAddSourcemapSupport": false}',
            },
            ssredge: {
              'index.js': 'console.log("Hello World!")',
              '.vc-config.json':
                '{"runtime": "edge","name": "index","deploymentTarget": "v8-worker","entrypoint": "index.js","assets": [],"framework": {"slug": "nextjs","version": "13.0.0"}}',
            },
          },
        },
      },
    });

    const applicationMapping = {
      invalidFunctions: new Set(),
      functionsMap: new Map(),
      webpackChunks: new Map(),
      wasmIdentifiers: new Map(),
      prerenderedRoutes: new Map(),
    };

    const tmpFunctionsDir = '/tmp/azion-functions';

    await expect(() =>
      mapAndAdaptFunctions(applicationMapping, tmpFunctionsDir),
    ).rejects.toThrow();

    mockFs.restore();
  });
});
