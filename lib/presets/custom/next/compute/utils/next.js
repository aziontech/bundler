import { join } from 'path';
import { feedback } from '#utils';

/**
 * Get user project nextjs config file
 * @returns {object|null} - project config if present.
 */
async function getNextProjectConfig() {
  const path = join(process.cwd(), 'next.config.js');
  let config = null;

  try {
    config = (await import(path)).default;
  } catch (error) {
    feedback.prebuild.info("Configuration file ('next.config.js') not found.");
  }

  return config;
}

export default getNextProjectConfig;
