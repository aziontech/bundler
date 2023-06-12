import { vulcan } from '#env';
import _ from 'lodash';

const env = globalThis.vulcan?.env ? globalThis.vulcan.env : 'production';

const APIS = {
  local: 'http://localhost:8082',
  stage: 'https://stage-api.azion.net',
  production: 'https://api.azionapi.net',
};

/**
 * Removes leading and trailing slashes from a resource string.
 * @param {string} resource - The resource string to process.
 * @returns {string} The processed resource string without leading and trailing slashes.
 */
const removeLeadingAndTrailingSlashes = (resource) => (resource ? `/${resource.toString().replace(/^\/|\/$/g, '')}` : '');

/**
 * Reads the API token from the Vulcan environment.
 * @async
 * @returns {Promise<string>} A Promise that resolves to the API token.
 */
/**
/**
Retrieves the API authentication token from the Vulcan environment
and returns it as a header object.
 * @returns {Promise<object>} A Promise that resolves to an object
 * containing the token in the format { headers: { Authorization: 'Token ${value}' } }.
 */
const getAuthHeaders = async () => {
  const token = (await vulcan.readVulcanEnv()).API_TOKEN;
  return { headers: { Authorization: `Token ${token}` } };
};

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
        Accept: 'application/json; version=3',
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
  async get(resource, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    return fetch(fullUrl, {
      method: 'GET',
      ...mergedConfig,
    });
  }

  /**
   * Send a GraphQL GET request.
   * @param {string} resource - The resource path of the GraphQL endpoint.
   * @param {object} config - The configuration for the request.
   * @param {string} query - The GraphQL query string.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  async graphQl(resource, config, query) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    const payload = {
      query,
    };
    return fetch(fullUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...mergedConfig,
    });
  }

  /**
   * Send a POST request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  async post(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    console.log(mergedConfig);
    return fetch(fullUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      ...mergedConfig,
    });
  }

  /**
   * Send a PUT request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  async put(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    return fetch(fullUrl, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...mergedConfig,
    });
  }

  /**
   * Send a PATCH request.
   * @param {string} resource - The Resource to request.
   * @param {object} data - The data to send in the body of the request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  async patch(resource, data, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    return fetch(fullUrl, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...mergedConfig,
    });
  }

  /**
   * Send a DELETE request.
   * @param {string} resource - The Resource to request.
   * @param {object} config - The configuration for the request.
   * @returns {Promise} The Promise object representing the fetch operation.
   */
  async delete(resource, config) {
    const fullUrl = this.base + removeLeadingAndTrailingSlashes(resource);
    const authHeaders = config?.headers?.Authorization ? {} : await getAuthHeaders();
    const mergedConfig = _.merge({}, authHeaders, this.config, config);
    return fetch(fullUrl, {
      method: 'DELETE',
      ...mergedConfig,
    });
  }
}

export default BaseService;
