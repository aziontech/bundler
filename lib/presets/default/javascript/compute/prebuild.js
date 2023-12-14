import { Manifest } from '#utils';
/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  Manifest.setRoute({
    from: '/',
    to: '.edge/worker.js',
    priority: 1,
    type: 'compute',
  });
  Manifest.generate();
}

export default prebuild;
