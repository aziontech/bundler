import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/sveltekit-boilerplate';

describe('E2E - sveltekit-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'svelte', serverPort);

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

  test('Should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('h1');
    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('SvelteKit app');
    expect(pageContent).toContain('try editing');
    expect(pageTitle).toBe('Home');
  });

  test('Should render home page in "/about" route', async () => {
    await page.goto(`${localhostBaseUrl}/about`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('h1');
    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('About this app');
    expect(pageTitle).toBe('About');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.png')
      .expect(200)
      .expect('Content-Type', 'image/png');
  });
});
