/* eslint-disable jest/expect-expect */
import puppeteer from 'puppeteer';
import { expect } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/nextjs/edge-pages-14-2-15-middleware';

describe('E2E - next-14-2-15-middleware project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'next', serverPort);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render Internal Server Error page', async () => {
    await page.goto(`${localhostBaseUrl}/api/hello?throw`, {
      waitUntil: 'networkidle0',
    });

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Internal Server Error');
    expect(pageTitle).toBe('500: Internal Server Error');
  });

  test('Should render a page without middleware aciont', async () => {
    await page.goto(`${localhostBaseUrl}/common`, {
      waitUntil: 'networkidle0',
    });
    const pageContent = await page.content();

    expect(pageContent).toContain('Common Page');
  });

  test('Should render correct page content in Middleware Rewrite', async () => {
    await page.goto(`${localhostBaseUrl}/api?rewrite=true`, {
      waitUntil: 'networkidle0',
    });

    const pageContent = await page.content();

    expect(pageContent).toMatch('Rewrite Page');
  });

  test(
    'Should render correct page content in "/redirect-page"',
    async () => {
      await page.goto(`${localhostBaseUrl}/redirect-page`, {
        waitUntil: 'networkidle0',
      });
      await page.reload();
      const pageContent = await page.content();

      expect(pageContent).toMatch('Redirect Page');
    },
    TIMEOUT,
  );

  test('Should render correct page content in middleware - go to response', async () => {
    await page.goto(`${localhostBaseUrl}/api/hello?next=true`, {
      waitUntil: 'networkidle0',
    });

    const pageContent = await page.content();

    expect(pageContent).toContain('John Doe');
  });

  test('Should render correct page content in middleware - Returns', async () => {
    await page.goto(`${localhostBaseUrl}/api/hello?returns`, {
      waitUntil: 'networkidle0',
    });

    const pageContent = await page.content();

    expect(pageContent).toMatch('Response from middleware');
  });

  test('Should render correct page content in middleware - cookie and hearde', async () => {
    const response = await page.goto(`${localhostBaseUrl}/api/hello`, {
      waitUntil: 'networkidle0',
    });

    const headers = response.headers();
    expect(headers['set-cookie']).toMatch(
      'x-cookie-from-middleware=hello-cookie',
    );
    expect(headers['x-header-from-middleware']).toMatch('hello-header');
  });
});
