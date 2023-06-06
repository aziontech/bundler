const env = globalThis.vulcan?.env ? globalThis.vulcan.env : 'development';

const APIS = {
  development: 'http://localhost:8082',
  stage: 'http://...',
  production: 'https://api.azionapi.net',
};

const removeLeadingAndTrailingSlashes = (resource) => (resource ? `/${resource.toString().replace(/^\/|\/$/g, '')}` : '');

/**
 * Class representing a base service.
 * @example
 * class FrodoService extends BaseService {
 *   constructor() {
 *     super('frodoApi', '/v3', { headers: { 'Content-Type': 'text/plain' } });
 *   }
 *
 *   getRing() {
 *     return super.get('/rings');
 *   }
 *   postLembas(lembas){
 *     return super.post('/lembas', lembas)
 *   }
 * }
 */

class BaseService {
  /**
   * Create a base service.
   * @param {string} resource - The resource of the API.
   * @param {object} config - The configuration for the service.
   */
  constructor(resource, config) {
    this.base = APIS[env] + (resource || '');
    this.config = {
      timeout: 90000,
      headers: {
        'Content-Type': 'application/json',
        // Authorization: '', // TEMP !!!!!!
        Cookie: '', // TODO -> Add your cookie while we don't provide authentication.
      },
      ...config,
    };
  }

  /**
   * Send a GET request.
   * @param {string} resource - The Resource to request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  get(resource, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    return fetch(fullUrl, {
      method: 'GET',
      ...this.config,
      ...config,
    });
  }

  /**
   * Send a GraphQL GET request.
   * @param {string} resource - The resource path of the GraphQL endpoint.
   * @param {object} config - The configuration for the request.
   * @param {string} query - The GraphQL query string.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  graphQl(resource, config, query) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const payload = {
      query,
    };
    return fetch(fullUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...this.config,
      ...config,
    });
  }

  /**
   * Send a POST request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  post(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    return fetch(fullUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      ...this.config,
      ...config,
    });
  }

  /**
   * Send a PUT request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  put(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    return fetch(fullUrl, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...this.config,
      ...config,
    });
  }

  /**
   * Send a PATCH request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  patch(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    return fetch(fullUrl, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...this.config,
      ...config,
    });
  }

  /**
   * Send a DELETE request.
   * @param {string} resource - The Resource to request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  delete(resource, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    return fetch(fullUrl, {
      method: 'DELETE',
      ...this.config,
      ...config,
    });
  }
}

export default BaseService;
