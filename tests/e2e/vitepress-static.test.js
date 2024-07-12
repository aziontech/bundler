import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/vitepress-boilerplate-js';

describe('E2E - vitepress project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'vitepress', 'deliver', serverPort);

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

    expect(pageContent).toContain('A VitePress site');
    expect(pageTitle).toBe('VitePress Boilerplate');
  });

  test('Should render edge page in "/markdown-examples.html" route', async () => {
    await page.goto(`${localhostBaseUrl}/markdown-examples.html`);

    const pageContent = await page.content();

    expect(pageContent).toContain('Markdown Extension Examples');
  });
});
