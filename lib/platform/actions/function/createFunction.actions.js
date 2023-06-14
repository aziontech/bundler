import FunctionService from '../../services/function.service.js';

/**
 * Creates a new function (worker) for the edge application.
 * @async
 * @returns {Promise<object>} The created function (worker) object.
 * @throws {Error} If an error occurs during the function creation.
 */
async function createFunction() {
  try {
    const {
      name, code, language, initiatorType, jsonArgs, active,
    } = null;

    const payload = {
      name,
      code,
      language,
      initiator_type: initiatorType,
      json_args: jsonArgs,
      active,
    };
    return FunctionService.create(payload);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default createFunction;
