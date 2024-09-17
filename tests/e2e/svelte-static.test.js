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
const EXAMPLE_PATH = '/examples/svelte-static';

describe('E2E - svelte-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'svelte', serverPort);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('h1');
    const pageContent = await page.content();

    expect(pageContent).toContain('Welcome to SvelteKit');
    expect(pageContent).toContain('kit.svelte.dev');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.png')
      .expect(200)
      .expect('Content-Type', /image\/png/);
  });
});
