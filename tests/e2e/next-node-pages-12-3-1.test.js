/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import { expect } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/nextjs/node-pages-12-3-1';

describe('E2E - next-node-pages-12-3-1 project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'next', serverPort);

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
    });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" static route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Welcome to');
    expect(pageContent).toContain('Next.js!');
    expect(pageContent).toContain(
      'Learn about Next.js in an interactive course with quizzes!',
    );
    expect(pageTitle).toBe('Create Next App');
  });

  test('Should render a page with dynamic content (date) in "/ssr" SSR route', async () => {
    await page.goto(`${localhostBaseUrl}/ssr`);
    const pageContent = await page.content();

    expect(pageContent).toContain('Edge SSR Example');
    expect(pageContent).toContain('Server message =');
    expect(pageContent).toContain('42');
  });

  test('Should render correct page content in "/teste/x" dynamic route', async () => {
    await page.goto(`${localhostBaseUrl}/teste/x`);

    const pageContent = await page.content();

    expect(pageContent).toMatch(/Slug in \/\[prodSlug\]\/x route: (.*?)teste/);
  });

  test('Should render correct page content in "/xptz" dynamic Catch-all route', async () => {
    await page.goto(`${localhostBaseUrl}/xptz`);

    const pageContent = await page.content();

    expect(pageContent).toMatch(/Slug in \/\[...catSlug\] route: (.*?)xptz/);
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

    const expected = { name: 'John Doe' };
    expect(response.body).toStrictEqual(expected);
  });
});
