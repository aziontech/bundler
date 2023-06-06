import BaseService from './base.service.js';

class FunctionsService extends BaseService {
  constructor() {
    super(
      '/edge_functions',
      {
        withCredentials: true,
        crossDomain: true,
        headers: {
          Accept: 'application/json; version=1',
        },
      },
    );
  }

  getAll() {
    return super.get();
  }
}

// singleton-pattern
export default new FunctionsService();
