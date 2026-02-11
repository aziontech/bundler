import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/hugo-static';

describe('E2E - html project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'hugo', serverPort);

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

  test('Should render the "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Recent Posts');
    expect(pageTitle).toBe('My New Hugo Site');
  });

  test('Should render a post', async () => {
    await page.goto(`${localhostBaseUrl}/posts/my-first-post/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Introduction');
    expect(pageContent).toContain('February 3, 2024');
    expect(pageTitle).toBe('My First Post | My New Hugo Site');
  });

  test('Should return correct content type for non-html files', async () => {
    await request.get('/ananke/css/main.min.css').expect(200).expect('Content-Type', 'text/css');
  });
});
