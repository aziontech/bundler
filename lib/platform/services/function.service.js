import BaseService from './base.service.js';

class FunctionsService extends BaseService {
  constructor() {
    super('/edge_functions');
  }

  getAll() {
    return super.get();
  }
}

// singleton-pattern
export default new FunctionsService();
