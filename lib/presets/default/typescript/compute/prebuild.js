import { Manifest } from '#utils';
/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  Manifest.setRoute('compute', {
    from: '/',
    to: '/worker.js',
    priority: 1,
  });
  Manifest.generate();
}

export default prebuild;
