import supertest from 'supertest';
import { expect } from '@jest/globals';
import zlib from 'node:zlib';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 3000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/runtime-apis/nodejs/zlib';

describe('Node.js APIs - zlib', () => {
  let request;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'javascript', serverPort, false);
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));
  }, TIMEOUT);

  test('should request the "/" route and get a 200 status code', async () => {
    const response = await request.get('/');
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toMatch(/octet-stream/);
    expect(response.headers['transfer-encoding']).toEqual('chunked');
    expect(response.body.toString()).toEqual('H4sIAAAAAAAAA/NIzcnJ11EIzy/KSVEEANDDSuwNAAAA');
    // decompressed
    const decodeBase64 = Buffer.from(response.body.toString(), 'base64');
    const decompressedBody = zlib.gunzipSync(decodeBase64).toString();
    expect(decompressedBody).toEqual('Hello, World!');
    // Hello, World!
  });
});
