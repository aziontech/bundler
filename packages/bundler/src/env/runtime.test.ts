import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import runtime from './runtime';
import { BUNDLER } from '../constants';
import { WORKER_TEMPLATES } from '../commands/build/modules/worker/constants';

const writeArgs = (content: string) => {
  fs.mkdirSync('azion', { recursive: true });
  fs.writeFileSync('azion/args.json', content);
};

// the same wrapper the build generates for `export default { fetch(request, env, ctx) }` in dev
const esmFetchWorker = `
const handlers = { fetch: (request, env, ctx) => new Response(JSON.stringify(ctx.args)) };
${WORKER_TEMPLATES.fetchHandler(false)}`;

describe('runtime args', () => {
  let dir: string;
  let previousCwd: string;

  beforeEach(() => {
    // set by main.ts in the CLI, and read by the FetchEvent polyfill of @aziontech/builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).bundler = { argsPath: BUNDLER.ARGS_PATH };
    previousCwd = process.cwd();
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-')));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('binds azion/args.json to ctx.args of a fetch(request, env, ctx) handler', async () => {
    writeArgs('{"apiUrl":"https://example.com"}');

    const response = await runtime(esmFetchWorker).dispatchFetch('http://localhost');

    expect(await response.json()).toEqual({ apiUrl: 'https://example.com' });
  });

  it('binds the file of --args-path to ctx.args', async () => {
    writeArgs('{"from":"default"}');
    fs.writeFileSync('other.json', '{"from":"other"}');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).bundler.argsPath = 'other.json';

    const response = await runtime(esmFetchWorker).dispatchFetch('http://localhost');

    expect(await response.json()).toEqual({ from: 'other' });
  });

  it('binds an empty ctx.args when the project has no args.json', async () => {
    const response = await runtime(esmFetchWorker).dispatchFetch('http://localhost');

    expect(await response.json()).toEqual({});
  });

  it('reads the args again on every request', async () => {
    const vm = runtime(esmFetchWorker);

    writeArgs('{"v":1}');
    expect(await (await vm.dispatchFetch('http://localhost')).json()).toEqual({ v: 1 });

    writeArgs('{"v":2}');
    expect(await (await vm.dispatchFetch('http://localhost')).json()).toEqual({ v: 2 });
  });

  it('keeps event.args for the addEventListener("fetch") signature', async () => {
    writeArgs('{"legacy":true}');
    const code = `addEventListener('fetch', (event) => event.respondWith(new Response(JSON.stringify(event.args))));`;

    const response = await runtime(code).dispatchFetch('http://localhost');

    expect(await response.json()).toEqual({ legacy: true });
  });

  it('binds ctx.args of a firewall handler, which runs as a fetch event in dev', async () => {
    writeArgs('{"blocked":["1.1.1.1"]}');
    const code = `
const handlers = {
  firewall: (request, env, ctx) => ctx.respondWith(new Response(JSON.stringify(ctx.args))),
};
${WORKER_TEMPLATES.firewallHandler.replace("addEventListener('firewall'", "addEventListener('fetch'")}`;

    const response = await runtime(code, true).dispatchFetch('http://localhost');

    expect(await response.json()).toEqual({ blocked: ['1.1.1.1'] });
  });
});
