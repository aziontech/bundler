import { expect } from '@jest/globals';
import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/simple-js-firewall-event';

describe('E2E - simple-js-firewall-event project', () => {
  let request;

  beforeEach(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(
      EXAMPLE_PATH,
      'javascript',
      'compute',
      serverPort,
      false,
      undefined,
      true,
    );
  }, TIMEOUT);

  afterEach(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));
  }, TIMEOUT);

  test('should receive a 417 status code, the response headers and body message', async () => {
    const response = await request
      .get('/')
      .expect(417)
      .expect('Content-Type', /text\/plain/)
      .expect('X-Fire-Status', 'On')
      .expect('X-Fire-Type', 'Coal')
      .expect('X-Country-Name', 'United States');
    expect(response.text).toContain('The broccoli is burning.');
  });
});
