import { NodeVM } from 'vm2';
import { RuntimeApis } from '#constants';

/**
 * Execute the specified code with the provided event object.
 * @param {string} code - The JavaScript code to be executed.
 * @param {object} event - The event object containing the request and other properties.
 * @returns {Promise<object>} A Promise that resolves with the Response object.
 */
async function run(code, event) {
  let fetchEventHandler = null;
  let respondWithPromise = null;

  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {
      ...event,
      Response,
      addEventListener: (type, handler) => {
        if (type !== 'fetch') {
          throw new Error(`Unsupported event type: ${type}`);
        }
        fetchEventHandler = handler;
      },
    },
    require: {
      external: true,
      builtin: RuntimeApis,
    },
  });

  try {
    vm.run(code);
  } catch (error) {
    console.error('An error occurred while executing the script:', error);
    throw error;
  }

  if (!fetchEventHandler) {
    throw new Error('No fetch event handler was defined');
  }

  let response;
  try {
    const fetchEvent = {
      request: event.request,
      respondWith: (responsePromise) => {
        respondWithPromise = responsePromise;
      },
    };
    fetchEventHandler(fetchEvent);
    response = respondWithPromise;
  } catch (error) {
    console.error('An error occurred while handling the fetch event:', error);
    throw error;
  }

  if (!response) {
    throw new Error('No response was defined');
  }

  return response;
}

export default run;
