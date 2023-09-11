/**
Global messages object.
@property {object} success - Success messages.
@property {object} info - Information messages.
@property {object} errors - Error messages.
 */
const global = {
  success: {},
  info: {
    name_required: 'A name is required.',
  },
  errors: {
    unknown_error: 'An error occurred.',
    invalid_choice: 'Invalid choice.',
    folder_name_already_exists: (folder) => `The folder ${folder} already exists. Please choose a different name.`,
    folder_creation_failed: (folder) => `An error occurred while creating the ${folder} folder.`,
    write_file_failed: (file) => `An error occurred while writing the ${file} file.`,
    file_doesnt_exist: (file) => `An error occurred while reading the ${file} file.`,
    invalid_node_version: (minVersion) => `Invalid Node version. Node version must be greater than ${minVersion}.`,
  },
};

export default global;
