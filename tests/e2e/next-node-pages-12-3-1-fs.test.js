/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import { expect } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

const SERVER_PORT = 3013;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/next/node-pages-12-3-1-fs';

describe('E2E - next node-pages-12-3-1-fs project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(EXAMPLE_PATH, 'next', 'compute', SERVER_PORT);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(SERVER_PORT, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" static route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Welcome to');
    expect(pageContent).toContain('Next.js!');
    expect(pageContent).toContain(
      'Learn about Next.js in an interactive course with quizzes!',
    );
    expect(pageTitle).toBe('Create Next App');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /image/);
  });

  test('Should return correct data in "/api/hello" API Route', async () => {
    const response = await request
      .get('/api/hello')
      .expect(200)
      .expect('Content-Type', /json/);

    const expected = {
      data: { example: 'fs', status: 'ok' },
      message: 'My message!',
    };
    expect(response.body).toStrictEqual(expected);
  });
});
