import { test } from '@jest/globals';
import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 3000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/javascript/simple-js-network-list';

describe('E2E - simple-js-network-list project', () => {
  let request;

  beforeEach(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(
      EXAMPLE_PATH,
      'javascript',
      serverPort,
      true,
      'http://0.0.0.0',
      false,
      'index.js',
    );
  }, TIMEOUT);

  afterEach(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));
  }, TIMEOUT);

  test('should return 200 and the response header x-presence with the value present', async () => {
    const response = await request
      .get('/')
      .set('x-network-list-id', '1111')
      .set('x-element', '10.0.0.1')
      .expect(200);

    expect(response.headers['x-presence']).toBe('present');
  });

  test('should return 403 and the response header x-presence with the value absent', async () => {
    const response = await request
      .get('/')
      .set('x-network-list-id', '1111')
      .set('x-element', '10.0.0.3')
      .expect(200);

    expect(response.headers['x-presence']).toBe('absent');
  });
});
