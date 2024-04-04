import { expect } from '@jest/globals';
import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import {
  execCommandInContainer,
  getContainerPort,
} from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 3000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/javascript/simple-js-env-vars';

describe('E2E - simple-js-env-vars project', () => {
  let request;

  beforeEach(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await execCommandInContainer(
      `sh -c 'rm -rf .edge && rm -rf .env'`,
      `/${EXAMPLE_PATH}`,
    );

    // eslint-disable-next-line jest/no-standalone-expect
    if (expect.getState().currentTestName.includes('200')) {
      await execCommandInContainer(
        `sh -c 'echo "MY_VAR=EdgeComputing" > .env'`,
        `/${EXAMPLE_PATH}/`,
      );
    }

    await projectInitializer(
      EXAMPLE_PATH,
      'javascript',
      'compute',
      serverPort,
      false,
    );
  }, TIMEOUT);

  afterEach(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));
  }, TIMEOUT);

  test('should receive a 500 status code and env var not defined in .env file', async () => {
    const response = await request
      .get('/')
      .expect(500)
      .expect('Content-Type', /text\/plain/);

    expect(response.text).toContain('Environment variable not found');
  });

  test('should receive a 200 status code and env var defined in .env file', async () => {
    const response = await request
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/plain/);

    expect(response.text).toContain('Hello Env Vars');
  });
});
