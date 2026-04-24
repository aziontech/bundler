import supertest from 'supertest';
import puppeteer from 'puppeteer';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/simple-html';

describe('E2E - html project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    request = supertest(localhostBaseUrl);

    await projectInitializer(EXAMPLE_PATH, 'html', serverPort);

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

  test('Should render index.html when requesting "/"', async () => {
    await page.goto(`${localhostBaseUrl}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('<h1>Simple HTML');
    expect(pageTitle).toBe('Simple HTML');
  });

  test('Should render the /index.html for subfolders as well', async () => {
    await page.goto(`${localhostBaseUrl}/more-html-files/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Subfolder for other HTML files');
    expect(pageContent).toContain('yet another page');
    expect(pageTitle).toBe('More HTML Files');
  });

  test('Should render an html file standalone', async () => {
    await page.goto(`${localhostBaseUrl}/more-html-files/other-page.html`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Just another page...');
    expect(pageTitle).toBe('Other Page');
  });

  test('Should return correct content type for non-html files', async () => {
    await request.get('/misc/img/btr.gif').expect(200).expect('Content-Type', 'image/gif');
  });
});
