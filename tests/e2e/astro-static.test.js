/* eslint-disable jest/expect-expect */
import supertest from 'supertest';

import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// 1 min timeout
const TIMEOUT = 1 * 60 * 1000;

describe('E2E - astro-static project', () => {
  const examplePath = '/examples/astro-static/';
  let request;

  beforeAll(async () => {
    request = supertest('http://localhost:3000');

    await projectInitializer(examplePath, 'astro', 'deliver');
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    const resp = await request
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(resp.text).toMatch('To get started, open the directory');
    expect(resp.text).toMatch(
      'Learn how Astro works and explore the official API docs.',
    );
  });

  test('Should render edge page in "/edge" route', async () => {
    const resp = await request
      .get('/edge')
      .expect(200)
      .expect('Content-Type', /html/);

    expect(resp.text).toMatch('Running in Edge.');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.svg')
      .expect(200)
      .expect('Content-Type', /image\/svg/);
  });
});
