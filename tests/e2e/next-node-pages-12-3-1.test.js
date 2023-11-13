/* eslint-disable jest/expect-expect */
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import { expect } from '@jest/globals';
import projectInitializer from '../utils/project-initializer.js';
import projectStop from '../utils/project-stop.js';

// timeout in minutes
const TIMEOUT = 10 * 60 * 1000;

const SERVER_PORT = 3007;
const LOCALHOST_BASE_URL = `http://localhost:${SERVER_PORT}`;
const EXAMPLE_PATH = '/examples/next/node-pages-12-3-1';

/**
 * Check if a date is in a date range
 * @param {Date} date - date to test
 * @param {Date} startDate - start date
 * @param {Date} endDate - end date
 * @returns {boolean} - with the answer
 */
function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

describe('E2E - next node-pages-12-3-1 project', () => {
  let request;
  let browser;
  let page;

  beforeAll(async () => {
    request = supertest(LOCALHOST_BASE_URL);

    await projectInitializer(EXAMPLE_PATH, 'next', 'compute', SERVER_PORT);

    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  }, TIMEOUT);

  afterAll(async () => {
    await projectStop(SERVER_PORT, EXAMPLE_PATH.replace('/examples/', ''));

    await browser.close();
  }, TIMEOUT);

  test('Should render home page in "/" static route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/`);

    const pageContent = await page.content();
    const pageTitle = await page.title();

    expect(pageContent).toContain('Welcome to');
    expect(pageContent).toContain('Next.js!');
    expect(pageContent).toContain(
      'Learn about Next.js in an interactive course with quizzes!',
    );
    expect(pageTitle).toBe('Create Next App');
  });

  test('Should render a page with dynamic content (date) in "/ssr" SSR route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/ssr`);

    const pageContent = await page.content();

    const regex = /<span>(.*?)<\/span>/;
    const match = pageContent.match(regex);
    const dateStr = match ? match[1].trim() : '';
    const date = new Date(dateStr);

    const currentDate = new Date();
    const tenSecondsBefore = new Date(currentDate);
    tenSecondsBefore.setMinutes(currentDate.getSeconds() - 10);
    const tenSecondsAfter = new Date(currentDate);
    tenSecondsAfter.setMinutes(currentDate.getSeconds() + 10);

    expect(pageContent).toContain('Edge SSR Example');
    expect(pageContent).toContain('Server message =');
    expect(isDateInRange(date, tenSecondsBefore, tenSecondsAfter)).toBe(true);
  });

  test('Should render correct page content in "/teste/x" dynamic route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/teste/x`);

    const pageContent = await page.content();

    expect(pageContent).toMatch(/Slug in \/\[prodSlug\]\/x route: (.*?)teste/);
  });

  test('Should render correct page content in "/xptz" dynamic Catch-all route', async () => {
    await page.goto(`${LOCALHOST_BASE_URL}/xptz`);

    const pageContent = await page.content();

    expect(pageContent).toMatch(/Slug in \/\[...catSlug\] route: (.*?)xptz/);
  });

  test('Should return correct asset', async () => {
    await request
      .get('/favicon.ico')
      .expect(200)
      .expect('Content-Type', /image/);
  });

  test('Should return correct data in "/api/hello" API Route', async () => {
    const response = await request
      .get('/api/hello')
      .expect(200)
      .expect('Content-Type', /json/);

    const expected = { name: 'John Doe' };
    expect(response.body).toStrictEqual(expected);
  });
});
