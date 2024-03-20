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
const EXAMPLE_PATH = '/examples/nextjs/edge-pages-13-5-6-configs';

describe('E2E - next-13-5-6-configs project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'next', 'compute', serverPort);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render  Rewrite Before Page', async () => {
    await page.goto(`${localhostBaseUrl}/run-rewrite-before?overrideMe=true`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Rewrite Before Page');
    expect(pageTitle).toBe('Rewrite Before Page');
  });

  test('Should render  Rewrite After Page', async () => {
    await page.goto(`${localhostBaseUrl}/run-rewrite-after`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Rewrite After Page');
    expect(pageTitle).toBe('Rewrite After Page');
  });

  test('Should render  Fallback', async () => {
    await page.goto(`${localhostBaseUrl}/xptz`);

    const pageContent = await page.content();

    expect(pageContent).toMatch('John Doe');
  });

  test('Should redirect after click on simple Redirect route', async () => {
    await page.goto(`${localhostBaseUrl}`);

    await Promise.all([
      page.waitForNavigation(),
      page.click('a[href="/run-simple-redirect"]'),
    ]);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toMatch('Redirect Page');
    expect(pageTitle).toBe('Redirect Page');
  });

  test(
    'Should redirect after click on permanet Redirect route',
    async () => {
      await page.goto(`${localhostBaseUrl}`);
      await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/run-redirect-permanent"]'),
      ]);

      const pageContent = await page.content();
      const pageTitle = await page.title();

      expect(pageContent).toMatch('Redirect Permanent Page');
      expect(pageTitle).toBe('Redirect Permanent Page');
    },
    TIMEOUT,
  );
});
