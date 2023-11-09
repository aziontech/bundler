/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

const SERVER_PORT = 3004;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/react-static';

describe('E2E - react-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(EXAMPLE_PATH, 'react', 'deliver', SERVER_PORT);

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

    expect(pageContent).toContain('Learn React');
    expect(pageContent).toContain(
      '<p>Edit <code>src/App.js</code> and save to reload.</p>',
    );
    expect(pageTitle).toBe('React App');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /image/);
  });
});
