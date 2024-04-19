/* eslint-disable jest/expect-expect */
import puppeteer from 'puppeteer';
import { describe, expect, test } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';
import { getContainerPort } from '../utils/docker-env-actions.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

let serverPort;
let localhostBaseUrl;
const EXAMPLE_PATH = '/examples/next/edge-pages-13-5-6-i18n';

describe('E2E - next-13-5-6-i18n project', () => {
  let browser;
  let page;

  beforeAll(async () => {
    serverPort = getContainerPort();
    localhostBaseUrl = `http://0.0.0.0:${serverPort}`;

    await projectInitializer(EXAMPLE_PATH, 'next', 'compute', serverPort);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(serverPort, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  describe('Should test i18n on root page', () => {
    const routes = [
      { route: '/', assertion: 'en' },
      { route: '/fr', assertion: 'fr' },
      { route: '/ar', assertion: 'ar' },
    ];
    test.each(routes)(
      'Should render correct language for route',
      async ({ route, assertion }) => {
        await page.goto(`${localhostBaseUrl}${route}`);

        const pageContent = await page.content();

        expect(pageContent).toContain(assertion);
        expect(pageContent).toContain('Index page');
      },
    );
  });

  describe('Should test i18n on dynamic get static props', () => {
    const routes = [
      { route: '/gsp/', assertion: 'en' },
      { route: '/gsp/fr', assertion: 'fr' },
      { route: '/gsp/ar', assertion: 'ar' },
    ];
    test.each(routes)(
      'Should render correct language for dynamic get Static props page',
      async ({ route, assertion }) => {
        await page.goto(`${localhostBaseUrl}${route}`);

        const pageContent = await page.content();

        expect(pageContent).toContain(assertion);
        expect(pageContent).toContain('dynamic getStaticProps page');
      },
    );
  });

  describe('Should test i18n on get static props', () => {
    const routes = [
      { route: '/en/gsp', assertion: 'en' },
      { route: '/fr/gsp', assertion: 'fr' },
      { route: '/ar/gsp', assertion: 'ar' },
    ];
    test.each(routes)(
      'Should render correct language for get Static props page',
      async ({ route, assertion }) => {
        await page.goto(`${localhostBaseUrl}${route}`);

        const pageContent = await page.content();

        expect(pageContent).toContain(assertion);
        expect(pageContent).toContain('getStaticProps page');
      },
    );
  });

  describe('Should test i18n on get server side props', () => {
    const routes = [
      { route: '/en/gssp', assertion: 'Welcome to Next.js i18n tutorial' },
      { route: '/fr/gssp', assertion: 'Bienvenue à Next.js i18n didacticiel' },
      {
        route: '/ar/gssp',
        assertion: 'مرحبًا بك في البرنامج التعليمي Next.js i18n',
      },
    ];
    test.each(routes)(
      'Should render correct language for route',
      async ({ route, assertion }) => {
        await page.goto(`${localhostBaseUrl}${route}`);

        const pageContent = await page.content();

        expect(pageContent).toContain(assertion);
        expect(pageContent).toContain('getServerSideProps page');
      },
    );
  });
});
