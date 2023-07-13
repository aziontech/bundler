/**
Environment messages object.
@property {object} success - Success messages.
@property {object} info - Information messages.
@property {object} errors - Error messages.
@property {object} runtime - Runtime messages.
@property {object} server - Server messages.
 */
const env = {
  success: {},
  info: {},
  errors: {
    invalid_environment: 'Invalid environment. Please set ENV to either production, stage, or local.',
  },
  runtime: {
    success: {},
    info: {},
    errors: {
      unknown_error: 'An error occurred while executing the script',
      fetch_event_missing: 'No fetch event handler was defined',
      fetch_event_unknown_error: 'An error occurred while handling the fetch event:',
      fetch_event_remove_listener: 'Unable to remove event listener.',
      fetch_event_type: (type) => `Unsupported event type: ${type}`,
      undefined_response: 'No response was defined',
    },
  },
  server: {
    success: {
      server_running: (port) => `Server running on port ${port}`,
    },
    info: {
      code_change_detect: 'Code change detected. Restarting server...',
    },
    errors: {
      load_worker_failed: 'Failed to load code:',
    },
  },
};

export default env;
