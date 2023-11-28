import MockFs from 'mock-fs';
import fs from 'fs';
import { expect } from '@jest/globals';
import Dispatcher from './dispatcher.js';
import {
  createDotEnvFile,
  folderExistsInProject,
  getAliasPath,
} from './helpers/helpers.js';

describe('dispatcher', () => {
  const { env } = process;
  beforeEach(() => {
    jest.resetModules();
    process.env = { HOME: '/home/user' };
    process.cwd = jest.fn(() => '/');
  });

  afterEach(() => {
    process.env = env;
  });
  it('should create a Dispatcher instance with correct properties', async () => {
    const config = {
      entry: 'main.js',
      builder: 'esbuild',
      preset: {
        name: 'javascript',
        mode: 'compute',
      },
      useNodePolyfills: false,
      useOwnWorker: false,
      memoryFS: undefined,
      custom: {},
    };

    const expectedDispatcher = {
      entry: 'main.js',
      builder: 'esbuild',
      preset: { name: 'javascript', mode: 'compute' },
      useNodePolyfills: false,
      useOwnWorker: false,
      memoryFS: undefined,
      custom: {},
      buildId: '123456',
      vulcanLibPath: './vulcan',
    };

    /**
     * generate mocked timestamp
     * @returns {string} - timestamp
     */
    function mockGenerateTimestamp() {
      return '123456';
    }

    /**
     * mock vulcan lib absolute path
     * @returns {string} - absolute path
     */
    function getAbsoluteLibDirPath() {
      return './vulcan';
    }

    const newDispatcher = new Dispatcher(
      config,
      mockGenerateTimestamp(),
      getAbsoluteLibDirPath(),
    );
    expect(newDispatcher).toBeInstanceOf(Dispatcher);
    expect(newDispatcher).toEqual(expectedDispatcher);
  });

  it('Should get alias path', async () => {
    MockFs({
      '/home': {
        user: {
          'package.json': JSON.stringify({
            imports: {
              '#alias': './dist/edge',
            },
          }),
          dist: {},
        },
      },
    });
    const aliasPath = await getAliasPath('alias', '/home/user', false);
    expect(aliasPath).toEqual('/home/user/dist/edge');
    MockFs.restore();
  });

  it('should create dot env file', () => {
    MockFs({});
    createDotEnvFile('123456', false);
    const vulcanEnvContent = fs.readFileSync('/.edge/.env', 'utf8');
    expect(vulcanEnvContent).toEqual('VERSION_ID=123456');
    MockFs.restore();
  });

  it('should create dot env file with windows enviroment', () => {
    MockFs({});
    createDotEnvFile('123456', true);
    const vulcanEnvContent = fs.readFileSync('/.edge/.env', 'utf8');
    expect(vulcanEnvContent).toEqual('VERSION_ID=123456');
    MockFs.restore();
  });

  it('Should verify if one directory exist in the project', async () => {
    MockFs({
      '/dist': {},
    });
    const folderExists = await folderExistsInProject('dist');
    expect(folderExists).toBe(true);
    MockFs.restore();
  });

  it('Should verify if one directory exist in the project and expect it fail', async () => {
    MockFs({
      '/dist': {},
    });
    const folderExists = await folderExistsInProject('distFail');
    expect(folderExists).toBe(false);
    MockFs.restore();
  });
});
