import BaseService from './base.service.js';

/**
 * Class representing the Events Service.
 * @augments BaseService
 */
class EventsService extends BaseService {
  /**
   * Create an instance of the EventsService.
   */
  constructor() {
    super('/events/graphql');
  }

  /**
   * Get the console logs for a specific function.
   * @param {string} functionId - The ID of the function.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getFunctionsLogs(functionId) {
    const filter = functionId ? `functionId: "${functionId}"` : '';

    return super.graphQl('', '', `
      query ConsoleLog {
        cellsConsoleEvents(
          limit: 10
          ${filter ? `filter: { ${filter} }` : ''}
          orderBy: [ts_DESC]
        ) {
          ts
          solutionId
          configurationId
          functionId
          id 
          lineSource 
          level 
          line
        }
      }
    `);
  }
}

// Singleton pattern
export default new EventsService();
