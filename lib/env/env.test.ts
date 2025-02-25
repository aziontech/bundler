import mockFs from 'mock-fs';
import fs from 'fs';
import path from 'path';
import bundlerEnv from './bundler';

jest.mock('prettier', () => ({
  format: jest.fn().mockImplementation((content) => content),
}));

jest.mock('#utils', () => ({
  feedback: {
    error: jest.fn(),
  },
  debug: {
    error: jest.fn(),
  },
}));

jest.mock('#constants', () => ({
  Messages: {
    errors: {
      folder_creation_failed: jest.fn(),
      file_doesnt_exist: jest.fn(),
      write_file_failed: jest.fn(),
    },
  },
}));

describe('Bundler env', () => {
  const originalEnv = process.env;
  const mockTempPath = '/mock/temp/path';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, HOME: '/home/user' };
    process.cwd = jest.fn(() => '/project');
    (globalThis as any).bundler = {
      tempPath: mockTempPath,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    mockFs.restore();
  });

  describe('createBundlerEnv', () => {
    it('Should create a vulcan env with global scope', async () => {
      mockFs({
        [mockTempPath]: {},
      });

      await bundlerEnv.createBundlerEnv(
        { API_KEY: 'abc123', ANOTHER_KEY: 'xyz' },
        'global',
      );

      const vulcanEnvContent = fs.readFileSync(
        path.join(mockTempPath, '.azion-bundler'),
        'utf8',
      );

      expect(vulcanEnvContent.trim()).toEqual(
        `API_KEY=abc123
ANOTHER_KEY=xyz`,
      );
    });

    it('Should create a vulcan env with local scope', async () => {
      mockFs({
        '/project': {},
      });

      await bundlerEnv.createBundlerEnv(
        { API_KEY: 'abc123', ANOTHER_KEY: 'xyz' },
        'local',
      );

      const vulcanEnvContent = fs.readFileSync(
        '/project/.azion-bundler',
        'utf8',
      );

      expect(vulcanEnvContent.trim()).toEqual(
        `API_KEY=abc123
ANOTHER_KEY=xyz`,
      );
    });

    it('Should update existing variables', async () => {
      mockFs({
        '/project/.azion-bundler': 'API_KEY=old_value\n',
      });

      await bundlerEnv.createBundlerEnv(
        { API_KEY: 'new_value', NEW_KEY: 'new_key_value' },
        'local',
      );

      const vulcanEnvContent = fs.readFileSync(
        '/project/.azion-bundler',
        'utf8',
      );

      expect(vulcanEnvContent.trim()).toEqual(
        `API_KEY=new_value
NEW_KEY=new_key_value`,
      );
    });
  });

  describe('readBundlerEnv', () => {
    it('Should read a vulcan env with global scope', async () => {
      mockFs({
        [path.join(mockTempPath, '.azion-bundler')]: 'API_KEY=abc123',
      });

      const envContent = await bundlerEnv.readBundlerEnv('global');

      expect(envContent).toEqual({ API_KEY: 'abc123' });
    });

    it('Should read a vulcan env with local scope', async () => {
      mockFs({
        '/project/.azion-bundler': 'API_KEY=abc123\nANOTHER_KEY=xyz',
      });

      const envContent = await bundlerEnv.readBundlerEnv('local');

      expect(envContent).toEqual({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' });
    });

    it('Should return null if file does not exist', async () => {
      mockFs({});

      const envContent = await bundlerEnv.readBundlerEnv('local');

      expect(envContent).toBeNull();
    });
  });

  describe('loadAzionConfig', () => {
    it('Should load an Azion config file', async () => {
      const configContent = `
        export default {
          build: {
            entry: './src/index.js',
            output: './dist',
          },
        };
      `;

      mockFs({
        '/project/azion.config.js': configContent,
      });

      const config = await bundlerEnv.loadAzionConfig();

      expect(config).toEqual({
        build: {
          entry: './src/index.js',
          output: './dist',
        },
      });
    });

    it('Should return null if Azion config file does not exist', async () => {
      mockFs({});

      const config = await bundlerEnv.loadAzionConfig();

      expect(config).toBeNull();
    });
  });
});
