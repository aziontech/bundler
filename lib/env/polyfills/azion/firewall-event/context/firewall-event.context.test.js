import { expect, test } from '@jest/globals';
import FirewallEventContext from './firewall-event.context.js';

describe('FirewallEventContext', () => {
  let event;

  beforeEach(() => {
    const request = {
      method: 'GET',
      url: 'http://localhost',
      headers: new Headers(),
    };
    event = new FirewallEventContext(request);
  });

  test('should be able to add a response header', () => {
    event.addResponseHeader('X-Broccoli-Status', 'Broccoli is fine.');
    event.continue();
    expect(event.response.headers.get('X-Broccoli-Status')).toBe(
      'Broccoli is fine.',
    );
  });

  test('should be able to continue the request', () => {
    event.continue();
    expect(event.response.status).toBe(200);
  });

  test('should be able to deny the request', () => {
    event.deny();
    expect(event.response.status).toBe(403);
  });

  test('should be able to respond with a custom response', async () => {
    event.respondWith(
      new Response('Custom Response', {
        status: 201,
      }),
    );
    expect(event.response.status).toBe(201);
    expect(await event.response.text()).toBe('Custom Response');
  });

  test('should be able to waitUntil a promise to be resolved', async () => {
    event.waitUntil(
      new Promise((resolve) => {
        event.addResponseHeader('X-Broccoli-Status', 'Broccoli is fine.');
        event.continue();
        resolve();
      }),
    );
    expect(event.response.headers.get('X-Broccoli-Status')).toBe(
      'Broccoli is fine.',
    );
  });
});
