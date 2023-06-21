/**
Global messages object.
@property {object} success - Success messages.
@property {object} info - Information messages.
@property {object} errors - Error messages.
 */
const global = {
  success: {},
  info: {},
  errors: {
    unknown_error: 'An error occurred.',
    folder_creation_failed: (folder) => `An error occurred while creating the ${folder} folder.`,
    write_file_failed: (file) => `An error occurred while writing the ${file} file.`,
    file_doesnt_exist: (file) => `An error occurred while reading the ${file} file.`,
  },
};

export default global;
