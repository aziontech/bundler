import MockFs from 'mock-fs';
import { expect } from '@jest/globals';
import Dispatcher from './dispatcher.js';
import { folderExistsInProject, getAliasPath } from './helpers/helpers.js';

jest.mock('prettier', () => ({
  format: jest.fn((content) => content),
}));

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
      vulcanLibPath: './vulcan',
    };

    /**
     * mock vulcan lib absolute path
     * @returns {string} - absolute path
     */
    function getAbsoluteLibDirPath() {
      return './vulcan';
    }

    const newDispatcher = new Dispatcher(config, getAbsoluteLibDirPath());
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
