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
const EXAMPLE_PATH = '/examples/eleventy-static';

describe('E2E - eleventy-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'eleventy', 'deliver', serverPort);

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

    expect(pageContent).toContain('Latest 3 Posts');

    expect(pageTitle).toBe('Eleventy Base Blog v8');
  });

  test('Should render edge page in "/about/" route', async () => {
    await page.goto(`${localhostBaseUrl}/about/`);

    const pageContent = await page.content();

    expect(pageContent).toContain('I am a person that writes stuff');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/img/IdthKOzqFA-350.avif')
      .expect(200)
      .expect('Content-Type', 'image/avif');
  });
});
