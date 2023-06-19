import fs from 'fs';
import path from 'path';
import FunctionService from '../../services/function.service.js';

/**
 * Get the initiator type based on the code signature.
 * @param {string} code - The code for the function.
 * @returns {string} The initiator type.
 */
function getInitiatorType(code) {
  const fetchSignature = 'addEventListener(\'fetch\'';
  const firewallSignature = 'addEventListener(\'firewall\'';

  if (code.includes(fetchSignature)) {
    return 'edge_application';
  } if (code.includes(firewallSignature)) {
    return 'edge_firewall';
  }
  return 'edge_application';
}

/**
 * Creates a new function (worker) for the edge application.
 * @param {string} [functionName] - The name of the function to be created.
 * @async
 * @returns {Promise<object>} The created function (worker) object.
 * @throws {Error} If an error occurs during the function creation.
 */
async function createFunction(functionName) {
  try {
    // get code
    const workerFilePath = path.join(process.cwd(), '.edge/worker.js');
    const code = fs.readFileSync(workerFilePath, 'utf8');

    // get json_args
    const argsFilePath = path.join(process.cwd(), '.edge/args.json');
    let jsonArgs = {};
    if (fs.existsSync(argsFilePath)) {
      const argsData = fs.readFileSync(argsFilePath, 'utf8');
      jsonArgs = JSON.parse(argsData);
    }

    // get initiator_type
    const initiatorType = getInitiatorType(code);

    const payload = {
      name: functionName,
      code,
      language: 'javascript',
      initiator_type: initiatorType,
      json_args: jsonArgs,
      active: true,
    };

    const response = await (await FunctionService.create(payload)).json();
    return response.results;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default createFunction;
