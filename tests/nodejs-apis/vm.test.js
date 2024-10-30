import supertest from 'supertest';
import { expect } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 3000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/runtime-apis/nodejs/vm';

describe('Node.js APIs - vm', () => {
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
    expect(response.headers['content-type']).toMatch(/text/);
    expect(response.text).toEqual('Done!');
  });
});
