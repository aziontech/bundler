import fs from 'fs';
import path from 'path';
import { generateTimestamp } from '#utils';
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
 * If not provided, a random name will be generated.
 * @async
 * @returns {Promise<object>} The created function (worker) object.
 * @throws {Error} If an error occurs during the function creation.
 */
async function createFunction(functionName) {
  try {
    const generatedName = functionName || `vulcan-${generateTimestamp()}`;

    // get code
    const workerFilePath = path.join(__dirname, '.edge/worker.js');
    const code = fs.readFileSync(workerFilePath, 'utf8');

    // get json_args
    const argsFilePath = path.join(__dirname, '.edge/args.json');
    const argsData = fs.readFileSync(argsFilePath, 'utf8');
    const jsonArgs = argsData ? JSON.parse(argsData) : {};

    // get initiator_type
    const initiatorType = getInitiatorType(code);

    const payload = {
      name: generatedName,
      code,
      language: 'javascript',
      initiator_type: initiatorType,
      json_args: jsonArgs,
      active: true,
    };

    return FunctionService.create(payload);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default createFunction;
