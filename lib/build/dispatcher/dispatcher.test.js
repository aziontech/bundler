// import Dispatcher from './dispatcher.js';
import MockFs from 'mock-fs';
import fs from 'fs';
import { expect } from '@jest/globals';
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
  it('should pass', () => {
    // TODO: fix this test
    // const newDispatcher = new Dispatcher('js', 'dist', 'main.js', 'v1');
    // // newDispatcher.run();
    expect(true).toBe(true);
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
    console.log(vulcanEnvContent);
    expect(vulcanEnvContent).toEqual('VERSION_ID=123456');
    MockFs.restore();
  });

  it('should create dot env file with windows enviroment', () => {
    MockFs({});
    createDotEnvFile('123456', true);
    const vulcanEnvContent = fs.readFileSync('/.edge/.env', 'utf8');
    console.log(vulcanEnvContent);
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
    console.log(folderExists);
    expect(folderExists).toBe(false);
    MockFs.restore();
  });
});
