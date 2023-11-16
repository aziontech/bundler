import { afterEach, beforeEach, describe, expect } from '@jest/globals';
import mockFs from 'mock-fs';
import fs from 'fs';
import runtime from './runtime.env.js';
import vulcanEnv from './vulcan.env.js';

describe('runtime env', () => {
  it('Should instantiate a edge runtime', () => {
    const code = `
       addEventListener('fetch', event => {
         const { searchParams } = new URL(event.request.url)
         const url = searchParams.get('url')
         return event.respondWith(fetch(url))
       })`;
    const edgeRuntime = runtime(code);

    expect(edgeRuntime).toBeDefined();
  });
});

describe('vulcan env', () => {
  const { env } = process;
  beforeEach(() => {
    jest.resetModules();
    process.env = { HOME: '/home/user' };
    process.cwd = jest.fn(() => '/');
  });

  afterEach(() => {
    process.env = env;
  });

  it('Should create a vulcan env with global scope', async () => {
    mockFs({});
    await vulcanEnv.createVulcanEnv(
      { API_KEY: 'abc123', ANOTHER_KEY: 'xyz' },
      'global',
    );

    const vulcanEnvContent = fs.readFileSync(
      '/home/user/.azion/.vulcan',
      'utf8',
    );

    expect(vulcanEnvContent.trim()).toEqual(
      `API_KEY=abc123
ANOTHER_KEY=xyz`,
    );
    mockFs.restore();
  });

  it('Should create a vulcan env with default scope', async () => {
    mockFs({});
    await vulcanEnv.createVulcanEnv({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' });

    const vulcanEnvContent = fs.readFileSync(
      '/home/user/.azion/.vulcan',
      'utf8',
    );

    expect(vulcanEnvContent.trim()).toEqual(
      `API_KEY=abc123
ANOTHER_KEY=xyz`,
    );
    mockFs.restore();
  });

  it('Should create a vulcan env with local scope', async () => {
    mockFs({});
    await vulcanEnv.createVulcanEnv(
      { API_KEY: 'abc123', ANOTHER_KEY: 'xyz' },
      'local',
    );

    const vulcanEnvContent = fs.readFileSync('/.vulcan', 'utf8');

    expect(vulcanEnvContent.trim()).toEqual(
      `API_KEY=abc123
ANOTHER_KEY=xyz`,
    );
    mockFs.restore();
  });

  it('Should update a vulcan env with local scope', async () => {
    mockFs({
      '/.vulcan': `API_KEY=abc123`,
    });
    await vulcanEnv.createVulcanEnv({ API_KEY: 'abc456' }, 'local');

    const vulcanEnvContent = fs.readFileSync('/.vulcan', 'utf8');

    expect(vulcanEnvContent.trim()).toEqual(`API_KEY=abc456`);
    mockFs.restore();
  });

  it('Should read a vulcan env with default scope', async () => {
    mockFs({
      '/home/user/.azion/.vulcan': `API_KEY=abc123`,
    });
    const envContent = await vulcanEnv.readVulcanEnv();

    expect(envContent).toMatchObject({ API_KEY: 'abc123' });
    mockFs.restore();
  });

  it('Should read a vulcan env with global scope', async () => {
    mockFs({
      '/home/user/.azion/.vulcan': `API_KEY=abc123`,
    });
    const envContent = await vulcanEnv.readVulcanEnv('global');

    expect(envContent).toMatchObject({ API_KEY: 'abc123' });
    mockFs.restore();
  });

  it('Should read a vulcan env with local scope', async () => {
    mockFs({
      '/.vulcan': `API_KEY=abc123`,
    });
    const envContent = await vulcanEnv.readVulcanEnv('local');

    expect(envContent).toMatchObject({ API_KEY: 'abc123' });
    mockFs.restore();
  });

  it('Should read a vulcanconfig file', async () => {
    mockFs({
      '/vulcan.config.js': `module.exports = {
        memoryFS: {
            injectionDirs: ['.faststore/@generated/graphql'],
            removePathPrefix: '.faststore/',
        }
      };`,
    });
    const expectedContent = {
      memoryFS: {
        injectionDirs: ['.faststore/@generated/graphql'],
        removePathPrefix: '.faststore/',
      },
    };
    const vulcaConfigFileContent = await vulcanEnv.loadVulcanConfigFile();
    expect(vulcaConfigFileContent).toEqual(expectedContent);
    mockFs.restore();
  });
});
