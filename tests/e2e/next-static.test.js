import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/nextjs/next-static';

describe('E2E - next-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'next', serverPort);

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

    expect(pageContent).toContain('Get started by editing');
    expect(pageContent).toContain(
      'Find in-depth information about Next.js features and API.',
    );
    expect(pageTitle).toBe('Create Next App');
  });

  test('Should render a post page in "/blog/post-2/" route', async () => {
    await page.goto(`${localhostBaseUrl}/blog/post-2/`);

    const pageContent = await page.content();

    expect(pageContent).toContain('My Post slug:');
    expect(pageContent).toContain('post-2');
  });

  test('Should render misty mountains moria page in "/misty-mountains/moria" route', async () => {
    await page.goto(`${localhostBaseUrl}/misty-mountains/moria`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('you shall not pass');
    expect(pageTitle).toBe('Create Next App');
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /image/);
  });
});
