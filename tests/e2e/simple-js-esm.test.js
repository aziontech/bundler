import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 1 * 60 * 1000;

const SERVER_PORT = 3003;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/simple-js-esm';

describe('E2E - simple-js-esm project', () => {
  let request;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(
      EXAMPLE_PATH,
      'javascript',
      'compute',
      SERVER_PORT,
      false,
    );
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(SERVER_PORT, EXAMPLE_PATH.replace('/examples/', ''));
  }, TIMEOUT);

  test('Should generate a message in "/" route', async () => {
    const response = await request
      .get('/')
      .expect(200)
      .expect('x-custom-feat', 'my random message')
      .expect('Content-Type', /text\/plain/);

    expect(response.text).toContain('Generated message:');
  });
});
