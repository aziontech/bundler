/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

const SERVER_PORT = 3001;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/astro-static';

describe('E2E - astro-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(EXAMPLE_PATH, 'astro', 'deliver', SERVER_PORT);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(SERVER_PORT, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('To get started, open the directory');
    expect(pageContent).toContain(
      'Learn how Astro works and explore the official API docs.',
    );
    expect(pageTitle).toBe('Welcome to Astro.');
  });

  test('Should render edge page in "/edge" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/edge`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Running in Edge.');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.svg')
      .expect(200)
      .expect('Content-Type', /image\/svg/);
  });
});
