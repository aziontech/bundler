import { expect } from '@jest/globals';
import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 3000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH =
  '/examples/javascript/simple-js-network-list-with-firewall';

describe('E2E - simple-js-network-list-with-firewall project', () => {
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

  test('should return 200 and the response header x-azion-outcome with the value continue', async () => {
    const response = await request
      .get('/')
      .set('x-network-list-id', '1111')
      .expect(200)
      .expect('x-azion-outcome', 'continue');

    expect(response.text).toContain('continue to origin');
  });
});
