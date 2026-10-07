import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 5000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/gatsby-static';

describe('E2E - gatsby-static project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'gatsby', serverPort);

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
    });
    page = await browser.newPage();

    // The example embeds an external image (https://via.placeholder.com in the hello-world post) and the page `load`
    // event waits for it, so the test depended on the network of the machine: where that host does not answer the
    // navigation times out. Only the local server is reached.
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      const isLocal = url.startsWith(localhostBaseUrl) || /^(data|blob|about):/.test(url);

      if (isLocal) request.continue();
      else request.abort();
    });
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''), EXAMPLE_PATH);

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" route', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('who lives and works in San Francisco building useful things.');
    expect(pageContent).toContain(
      'This is a custom description for SEO and Open Graph purposes, rather than the default generated excerpt. Simply add a description field to the frontmatter.',
    );
    expect(pageTitle).toBe('All posts | Gatsby Starter Blog');
  });

  test(
    'Should render edge page in "/hello-world" route',
    async () => {
      await page.goto(`${localhostBaseUrl}/hello-world`);

      const pageContent = await page.content();

      expect(pageContent).toContain('This is my first post on my new fake blog! How exciting!');
    },
    TIMEOUT,
  );

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /^image\/vnd\.microsoft\.(icon|ico)$/);
  });
});
