import { feedback } from '#utils';

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  feedback.info('Running prebuild actions for default js!');
}

export default prebuild;
