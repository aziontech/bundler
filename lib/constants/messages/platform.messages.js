/**
 * Platform messages object.
 * @property {object} success - Success messages.
 * @property {object} info - Information messages.
 * @property {object} errors - Error messages.
 * @property {object} auth - Authentication messages.
 * @property {object} deploy - Deployment messages.
 * @property {object} logs - Log messages.
 * @property {object} storage - Storage messages.
 * @property {object} propagation - Propagation messages.
 */
const platform = {
  success: {},
  info: {},
  errors: {},
  auth: {
    success: {
      auth_success: 'API authentication token saved successfully!',
    },
    info: {},
    error: {
      auth_failed: 'Authentication failed. Please check your credentials and try again.',
    },
  },
  deploy: {
    success: {
      created_edge_function: 'Worker successfully uploaded to Edge.',
      created_application: 'Application deployed successfully.',
      created_rule_engine: 'Rule Engine created.',
      created_domain: 'Domain created.',
      activated_edge_function: 'Activated Edge Function.',
      instantiated_edge_function: 'Edge Function Instantiated.',
      deploy_finished: 'Application successfully deployed to the edge network.',
    },
    info: {
      creating_edge_function: 'Creating Edge Function (worker)...',
      creating_edge_application: 'Creating Edge Application...',
      creating_rule_engine: 'Creating Rule Engine...',
      creating_domain: 'Creating Domain...',
      activating_edge_function: 'Enabling Edge Function...',
      instantiating_edge_function: 'Instantiating Edge Function...',

    },
    error: {
      deploy_failed: 'An error occurred during deployment',
    },
  },
  logs: {
    success: {},
    info: {
      watch_true: 'Waiting for the next request event...',
      unsupported_log_type: 'Logs for applications are not yet supported. Please specify "function" instead.',
      no_logs: 'There are no logs.',
    },
    errors: {
      invalid_log_type: 'Invalid log type. Please specify either "function" or "application".',
    },
  },
  storage: {
    success: {
      file_uploaded_success: (filePath) => `Uploaded file: ${filePath}`,
      statics_uploaded_finish: (successUploadCount) => `${successUploadCount} static assets successfully uploaded to Azion!`,
    },
    info: {},
    errors: {
      file_upload_failed: (filePath) => `Error uploading file: ${filePath}`,
    },
  },

  propagation: {
    success: {
      propagation_complete: 'Application has propagated to the edge networks and is ready to be accessed!',
    },
    info: {
      propagating: (edge) => `Propagating to ${edge}...`,
    },
    errors: {
      watch_propagation_failed: 'Error occurred while watching propagation.',
    },
  },

};

export default platform;
