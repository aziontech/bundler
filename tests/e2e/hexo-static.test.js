/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

const SERVER_PORT = 3009;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/hexo-static';

describe('E2E - hexo-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(EXAMPLE_PATH, 'hexo', 'deliver', SERVER_PORT);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(SERVER_PORT, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Hexo');
    expect(pageContent).toContain('Other page to test.');
    expect(pageContent).toContain('2023-11-14');
    expect(pageContent).toContain('This is your very first post');
  });

  test('Should render archives page in "/archives" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/archives`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Archives | Hexo');
    expect(pageContent).toContain(
      '<a href="/archives/2023" class="archive-year">2023</a>',
    );
    expect(pageContent).toContain('<div class="archives">');
    expect(pageContent).toContain('Other page');
    expect(pageContent).toContain('Hello World');
  });

  test('Should render "Hello World" post page in "/2023/11/14/hello-world/" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/2023/11/14/hello-world/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Hello World | Hexo');
    expect(pageContent).not.toContain('Other page to test.');
    expect(pageContent).toContain('2023-11-14');
    expect(pageContent).toContain('This is your very first post');
  });

  test('Should render "Other page" post page in "/2023/11/14/hello-world/" route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/2023/11/14/other-page/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageTitle).toBe('Other page | Hexo');
    expect(pageContent).toContain('Other page to test.');
    expect(pageContent).toContain('2023-11-14');
    expect(pageContent).not.toContain('This is your very first post');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/css/images/banner.jpg')
      .expect(200)
      .expect('Content-Type', /image/);
  });
});
