import { NodeVM } from 'vm2';
import { RuntimeApis, Messages } from '#constants';
import { feedback, debug } from '#utils';

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
      Headers,
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
    debug.error(error);
    feedback.error(Messages.env.runtime.errors.unknown_error);
    throw error;
  }

  if (!fetchEventHandler) {
    throw new Error(Messages.env.runtime.errors.fetch_event_missing);
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
    debug.error(error);
    feedback.error(Messages.env.runtime.errors.fetch_event_unknown_error);
    throw error;
  }

  if (!response) {
    throw new Error(Messages.env.runtime.errors.undefined_response);
  }

  return response;
}

export default run;
