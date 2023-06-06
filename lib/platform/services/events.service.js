import BaseService from './base.service.js';

class EventsService extends BaseService {
  constructor() {
    super('/events/graphql');
  }

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
// singleton-pattern
export default new EventsService();
