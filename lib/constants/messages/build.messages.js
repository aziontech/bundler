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
    rebuilding: 'We are rebuilding with the new changes...',
    prebuild_starting: 'Starting prebuild...',
    vulcan_build_starting: 'Starting Vulcan build...',
  },
  error: {
    vulcan_build_failed: 'Vulcan build failed.',
    invalid_preset:
      'Invalid build preset. Run "vulcan preset ls" to view available presets.',
    invalid_preset_mode: (mode, preset) =>
      `Mode '${mode}' does not exists in preset '${preset}'. Try 'deliver' or 'compute'.`,
    install_dependencies_failed: (pckManager) =>
      `Please run command to install dependencies. e.g ${pckManager} install.`,
    prebuild_error_validation_support: (framework, version, runtimes) =>
      `${framework} version (${version}) not supported to "${runtimes}" runtime(s).`,
  },
  warning: {
    use_node_polyfill_mode_deliver:
      'The use of useNodePolyfills is not available for this deliver mode preset.',
  },
};

export default build;
