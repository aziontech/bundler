import supertest from 'supertest';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

const TIMEOUT = 1 * 60 * 3000;

const EXAMPLE_PATH = '/examples/javascript/simple-js-esm-multiple-entries';
const ENTRIES = ['function1.js', 'function2.js'];

describe('E2E - simple-js-esm-multiple-entries project', () => {
  let requests;
  let ports;

  beforeAll(async () => {
    const basePort = getContainerPort();

    ports = await projectInitializer(
      EXAMPLE_PATH,
      'javascript',
      basePort,
      true,
      'http://localhost',
      false,
      ENTRIES,
    );

    requests = ports.map((port) => supertest(`http://0.0.0.0:${port}`));
  }, TIMEOUT);

  afterAll(async () => {
    // Para todos os servidores
    for (const port of ports) {
      await projectStop(port, EXAMPLE_PATH.replace('/examples/', ''));
    }
  }, TIMEOUT);

  test('Should return correct response from function1', async () => {
    const response = await requests[0].get('/').expect(200).expect('X-Function-Id', '1');

    expect(response.text).toBe('Function 1');
  });

  test('Should return correct response from function2', async () => {
    const response = await requests[1].get('/').expect(200).expect('X-Function-Id', '2');

    expect(response.text).toBe('Function 2');
  });
});
