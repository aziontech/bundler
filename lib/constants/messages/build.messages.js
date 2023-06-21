/**
Build messages object.
@property {object} success - Success messages.
@property {object} info - Information messages.
@property {object} error - Error messages.
 */
const build = {
  success: {
    prebuild_succeeded: 'Prebuild succeeded!',
    vulcan_build_succeeded: 'Vulcan Build succeeded!',
  },
  info: {
    prebuild_starting: 'Starting prebuild...',
    vulcan_build_starting: 'Starting Vulcan build...',

  },
  error: {
    vulcan_build_failed: 'Vulcan build failed.',
  },

};

export default build;
