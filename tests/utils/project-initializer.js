import { exec } from '#utils';

/**
 * Sleep n seconds
 * @param {number} seconds - time to sleep
 * @returns {any} - Resolved promise after timeout
 */
function sleep(seconds) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Run actions to build and run project in docker container
 * @param {string} examplePath - project path in container
 * @param {string} preset - vulcan preset to build
 * @param {string} mode - vulcan preset mode to build
 */
async function projectInitializer(examplePath, preset, mode) {
  const dockerCmd = `docker exec -w ${examplePath} test`;
  const dockerBkgCmd = dockerCmd.replace('-w', '-d -w');
  const vulcanCmd =
    'npx --yes --registry=http://verdaccio:4873 edge-functions@latest';

  // install project dependencies
  await exec(`${dockerCmd} yarn`, 'E2E test');

  // run vulcan build
  await exec(
    `${dockerCmd} ${vulcanCmd} build --preset ${preset} --mode ${mode}`,
    'E2E test',
  );

  // run vulcan in background
  await exec(`${dockerBkgCmd} ${vulcanCmd} dev`, 'E2E test');

  // wait vulcan server to start
  // TODO: improve this server init waiting
  await sleep(2);
}

export default projectInitializer;
