import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { feedback } from '@aziontech/utils/node';
import { loadSandboxArgs, setArgsPath } from './args';

describe('loadSandboxArgs', () => {
  let dir: string;
  let previousCwd: string;
  let warn: jest.SpiedFunction<typeof feedback.server.warn>;

  const writeArgs = (content: string) => {
    fs.mkdirSync('azion', { recursive: true });
    fs.writeFileSync('azion/args.json', content);
  };

  beforeEach(() => {
    previousCwd = process.cwd();
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'args-')));
    process.chdir(dir);
    warn = jest.spyOn(feedback.server, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(dir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('returns the content of azion/args.json', () => {
    writeArgs('{"apiUrl":"https://example.com","nested":{"a":1}}');

    expect(loadSandboxArgs()).toEqual({ apiUrl: 'https://example.com', nested: { a: 1 } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns an empty object, without a warning, when the file does not exist', () => {
    expect(loadSandboxArgs()).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns an empty object, with a warning, when the file is not valid JSON', () => {
    writeArgs('{ not json');

    expect(loadSandboxArgs()).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each(['[1,2]', 'null', '"text"', '42'])(
    'returns an empty object, with a warning, when the JSON is %s (not an object)',
    (content) => {
      writeArgs(content);

      expect(loadSandboxArgs()).toEqual({});
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  describe('setArgsPath', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).bundler = { argsPath: 'azion/args.json' };
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).bundler;
    });

    it('keeps a relative path relative to the project directory', () => {
      setArgsPath('./config/args.json');

      expect(globalThis.bundler.argsPath).toBe(path.join('config', 'args.json'));
    });

    it('makes an absolute path relative to the project directory, as the polyfill joins it with the cwd', () => {
      setArgsPath(path.join(dir, 'config', 'args.json'));

      expect(globalThis.bundler.argsPath).toBe(path.join('config', 'args.json'));
    });

    it('supports a file outside the project directory', () => {
      fs.writeFileSync(path.join(dir, '..', 'outside-args.json'), '{"outside":true}');
      try {
        setArgsPath(path.join(dir, '..', 'outside-args.json'));

        expect(globalThis.bundler.argsPath).toBe(path.join('..', 'outside-args.json'));
        expect(loadSandboxArgs()).toEqual({ outside: true });
      } finally {
        fs.rmSync(path.join(dir, '..', 'outside-args.json'), { force: true });
      }
    });
  });

  describe('with the path of bundler.argsPath (--args-path)', () => {
    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).bundler;
    });

    it('reads that file instead of azion/args.json', () => {
      writeArgs('{"from":"default"}');
      fs.mkdirSync('config');
      fs.writeFileSync('config/args.staging.json', '{"from":"custom"}');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).bundler = { argsPath: 'config/args.staging.json' };

      expect(loadSandboxArgs()).toEqual({ from: 'custom' });
    });

    it('accepts an absolute path', () => {
      fs.writeFileSync('custom.json', '{"abs":true}');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).bundler = { argsPath: path.join(dir, 'custom.json') };

      expect(loadSandboxArgs()).toEqual({ abs: true });
    });

    it('does not fall back to azion/args.json when the given file does not exist', () => {
      writeArgs('{"from":"default"}');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).bundler = { argsPath: 'missing.json' };

      expect(loadSandboxArgs()).toEqual({});
    });
  });

  it('reads the file on every call, so an edit needs no restart', () => {
    writeArgs('{"v":1}');
    expect(loadSandboxArgs()).toEqual({ v: 1 });

    writeArgs('{"v":2}');
    expect(loadSandboxArgs()).toEqual({ v: 2 });
  });
});
