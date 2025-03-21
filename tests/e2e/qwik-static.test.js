import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/qwik-static';

describe('E2E - qwik-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'qwik', serverPort);

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

  test('Should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Welcome to Qwik');
    expect(pageContent).toContain('Have fun building your App with Qwik');
  });

  test('Should render home page in "/demo/flower" route', async () => {
    await page.goto(`${localhostBaseUrl}/demo/flower`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Qwik Flower');
    expect(pageContent).toContain('Flowers');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.svg')
      .expect(200)
      .expect('Content-Type', 'image/svg+xml');
  });
});
