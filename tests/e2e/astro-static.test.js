/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/astro-static';

describe('E2E - astro-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://localhost:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'astro', 'deliver', serverPort);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('To get started, open the directory');
    expect(pageContent).toContain(
      'Learn how Astro works and explore the official API docs.',
    );
    expect(pageTitle).toBe('Welcome to Astro.');
  });

  test('Should render edge page in "/edge" route', async () => {
    await page.goto(`${localhostBaseUrl}/edge`);

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
