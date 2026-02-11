import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/nextjs/node-playground-15';

describe('E2E opennext-ssr project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'opennextjs', serverPort);

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
    });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''), EXAMPLE_PATH);

    await browser.close();
  }, TIMEOUT);

  test('should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Playground');
  });

  test('should navigate to "/loading" route', async () => {
    await page.goto(`${localhostBaseUrl}/loading`);

    const pageContent = await page.content();

    expect(pageContent).toContain(
      "is a file convention that lets you define fallback UI for a route segment when it's loading",
    );
  });

  test('should navigate to "/cached-routes" route', async () => {
    await page.goto(`${localhostBaseUrl}/cached-routes`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Cached Route Segments');
  });
});
