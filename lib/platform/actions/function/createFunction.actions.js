import fs from 'fs';
import path from 'path';
import { debug } from '#utils';
import FunctionService from '../../services/function.service.js';

/**
 * Get the initiator type based on the code signature.
 * @param {string} code - The code for the function.
 * @returns {string} The initiator type.
 */
function getInitiatorType(code) {
  const fetchSignature = "addEventListener('fetch'";
  const firewallSignature = "addEventListener('firewall'";

  if (code.includes(fetchSignature)) {
    return 'edge_application';
  }
  if (code.includes(firewallSignature)) {
    return 'edge_firewall';
  }
  return 'edge_application';
}

/**
 * @function
 * @memberof platform
 * @name createFunction
 * @description Creates a new function (worker) for the edge application.
 * It reads the function code and arguments from the respective '.edge/worker.js'
 * and '.edge/args.json' files, and infers the initiator type based on the function's code.
 * @param {string} [functionName] - Optional. The name of the function to be created.
 * If not provided, the name is determined from the function's code.
 * @returns {Promise<object>} A promise that resolves with the details of the created
 * function. The object returned contains details such as the function ID, name, code,
 * language, initiator type, arguments, and activation status.
 * @throws {Error} If the function creation fails, possibly due to invalid code or
 * function arguments, or due to a problem with the FunctionService.
 * @example
 * try {
 *    const functionDetails = await createFunction('myFunction');
 *    console.log(`Function created with ID: ${functionDetails.id}`);
 * } catch (error) {
 *    console.error('Failed to create function:', error);
 * }
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
    debug.error(error);
    throw error;
  }
}

export default createFunction;
