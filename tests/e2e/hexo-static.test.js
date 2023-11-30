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
const EXAMPLE_PATH = '/examples/hexo-static';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentDay = String(now.getDate()).padStart(2, '0');
const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
const dateWithSlashes = currentDate.replaceAll('-', '/');

describe.skip('E2E - hexo-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'hexo', 'deliver', serverPort);

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

    expect(pageTitle).toBe('Hexo');
    expect(pageContent).toContain('Other page to test.');
    expect(pageContent).toContain(currentDate);
    expect(pageContent).toContain('This is your very first post');
  });

  test('Should render archives page in "/archives" route', async () => {
    await page.goto(`${localhostBaseUrl}/archives`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Archives | Hexo');
    expect(pageContent).toContain(
      `<a href="/archives/${currentYear}" class="archive-year">${currentYear}</a>`,
    );
    expect(pageContent).toContain('<div class="archives">');
    expect(pageContent).toContain('Other page');
    expect(pageContent).toContain('Hello World');
  });

  test(`Should render "Hello World" post page in "/${dateWithSlashes}/hello-world/" route`, async () => {
    await page.goto(`${localhostBaseUrl}/${dateWithSlashes}/hello-world/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Hello World | Hexo');
    expect(pageContent).not.toContain('Other page to test.');
    expect(pageContent).toContain(currentDate);
    expect(pageContent).toContain('This is your very first post');
  });

  test(`Should render "Other page" post page in "/${dateWithSlashes}/hello-world/" route`, async () => {
    await page.goto(`${localhostBaseUrl}/${dateWithSlashes}/other-page/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Other page | Hexo');
    expect(pageContent).toContain('Other page to test.');
    expect(pageContent).toContain(currentDate);
    expect(pageContent).not.toContain('This is your very first post');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/css/images/banner.jpg')
      .expect(200)
      .expect('Content-Type', /image/);
  });
});
