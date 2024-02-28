import primitives from '@edge-runtime/primitives';
import crypto from 'node:crypto';

const OUTCOME_HEADER = 'X-Azion-Outcome';
const CONTENT_TYPE_HEADER = 'Content-Type';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

/**
 * @class FirewallEventContext
 * @description Class to handle with firewall event context
 *
 * This class is a VM context to handle with firewall event context
 * @example
 * addEventListener("firewall", (event) => {
 *  event.deny();
 * });
 */
class FirewallEventContext extends primitives.FetchEvent {
  #outcome = null;

  #request;

  #currentResponse;

  #responseHeaders;

  constructor(request) {
    super(request);

    // make request metadata available through the event's Request object.
    // the value comes directly as a JSON from Nginx.
    Object.defineProperty(request, 'metadata', {
      value: Object.freeze(this.#metadata()),
      writable: false,
    });

    Object.defineProperty(request, 'id', {
      value: crypto.randomUUID(),
      writable: false,
    });

    Object.defineProperty(request, 'raw_url', {
      value: () => this.#rawRequest(request),
      writable: false,
    });

    this.#request = request;
  }

  // eslint-disable-next-line class-methods-use-this
  #rawRequest(request) {
    let rawRequest = `${request.method} ${request.url} HTTP/1.1\n`;
    Array.from(request.headers.entries()).forEach(([header, value]) => {
      rawRequest += `${header}: ${value}\n`;
    });
    rawRequest += '\n';
    return rawRequest;
  }

  // metadata defined by Nginx, but is mocked here
  // eslint-disable-next-line class-methods-use-this
  #metadata() {
    return {
      geoip_city_continent_code: 'NA',
      geoip_city_country_code: 'US',
      geoip_city_country_name: 'United States',
      geoip_continent_code: 'NA',
      geoip_country_code: 'US',
      geoip_country_name: 'United States',
      geoip_region: 'NJ',
      geoip_region_name: 'New Jersey',
      remote_addr: '127.0.0.1',
      remote_port: '33440',
      remote_user: null,
      server_protocol: 'HTTP/1.1',
      ssl_cipher: null,
      ssl_protocol: null,
      geoip_asn: '14061',
      geoip_city: 'Clifton',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  #response() {
    const response = this.#currentResponse;
    // clone headers to avoid modifying the original response
    const headers = new Headers(response.headers);
    headers.set(OUTCOME_HEADER, this.#outcome);
    if (headers.has('Content-Type')) {
      headers.set(CONTENT_TYPE_HEADER, headers.get('Content-Type'));
    } else {
      headers.set(CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE);
    }
    if (this.#responseHeaders && this.#responseHeaders instanceof Headers) {
      Array.from(this.#responseHeaders.entries()).forEach(([header, value]) => {
        headers.set(header, value);
      });
    }
    return super.respondWith(
      new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      }),
    );
  }

  respondWith(response) {
    if (!(response instanceof Response) && !(response instanceof Promise)) {
      throw new TypeError(
        'respondWith expects a Response or a Promise that resolves to a Response',
      );
    }
    this.#outcome = 'respondWith';
    this.#currentResponse = response;
    this.#response();
  }

  deny() {
    this.#outcome = 'deny';
    this.#currentResponse = new Response('', {
      status: 403,
      statusText: 'Forbidden',
    });
    this.#response();
  }

  drop() {
    this.#outcome = 'drop';
    this.#currentResponse = new Response(null, {
      status: 421,
      statusText: 'ERR_HTTP2_PROTOCOL_ERROR',
    });
    this.#response();
  }

  continue() {
    this.#outcome = 'continue';
    this.#currentResponse = new Response('(mocked) continue to origin');
    this.#response();
  }

  addResponseHeader(header, value) {
    this.#responseHeaders = new Headers(this.#responseHeaders);
    this.#responseHeaders.append(header, value);
  }

  addRequestHeader(header, value) {
    this.#request.headers[header] = value;
  }
}

export default FirewallEventContext;
