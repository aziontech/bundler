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
const EXAMPLE_PATH = '/examples/next/next-12-static';

describe('E2E - next-12-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'next', 'deliver', serverPort);

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
    const numberOfItems = (pageContent.match(/Read more.../g) || []).length;

    expect(pageContent).toContain('List of posts');
    expect(numberOfItems).toBe(10);
    expect(pageTitle).toBe('Home page');
  });

  test('Should render a post page in "/post/1" route', async () => {
    await page.goto(`${localhostBaseUrl}/post/1`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Go back to home');
    expect(pageTitle).not.toBe('Home page');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /image/);
  });
});
