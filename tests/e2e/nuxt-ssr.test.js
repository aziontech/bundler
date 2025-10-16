import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/nuxt/nuxt-ssr';

describe('E2E - nuxt-ssr project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'nuxt', serverPort);

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

  test('should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Welcome to');
  });

  test('should navigate to "/ssr" route', async () => {
    await page.goto(`${localhostBaseUrl}/ssr`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Side Rendering');
  });
});
