/**
Build messages object.
@property {object} success - Success messages.
@property {object} info - Information messages.
@property {object} error - Error messages.
 */
const build = {
  success: {
    prebuild_succeeded: 'Prebuild succeeded!',
    vulcan_build_succeeded: 'Build completed!',
    manifest_succeeded: 'Manifest generated successfully!',
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
    prebuild_error_validation_support: (framework, version, runtimes) =>
      `${framework} version (${version}) not supported to "${runtimes}" runtime(s).`,
    install_dependencies_failed: (pckManager) =>
      `Please run command to install dependencies. e.g ${pckManager} install.`,
    prebuild_error_nextjs_invalid_functions: (
      framework,
      version,
      runtimes,
      invalidFunctions,
    ) =>
      `${framework} version (${version}) not supported to "${runtimes}" runtime(s).
      This project is not an edge project
      Make sure that following files have a correct configuration about edge runtime\n
      ${invalidFunctions.map((invalidFunction) => {
        return `\n       - ${invalidFunction.function}`;
      })}

      Maybe this links can help you\n
      https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes#segment-runtime-option
      https://nextjs.org/docs/pages/building-your-application/routing/api-routes#edge-api-routes\n
      `,
    firewall_disabled:
      'Firewall is disabled. Insert in the command line --firewall (Experimental) to enable it.',
  },
  warning: {
    use_node_polyfill_mode_deliver:
      'The use of useNodePolyfills is not available for this deliver mode preset.',
  },
};

export default build;
