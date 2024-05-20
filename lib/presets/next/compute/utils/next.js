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

/**
 * Detect if a path is a locale path based on locales array
 * @param {string} path - path to be checked
 * @param {Array} locales - locales path
 * @returns {boolean} - indicates if is a locale path
 */
function isLocalePath(path, locales) {
  let isLangRoute = false;
  if (locales && locales?.length > 0) {
    locales.forEach((lang) => {
      if (path.includes(`/${lang}/`) || path.includes(`/${lang}.func/`)) {
        isLangRoute = true;
      }
    });
  }

  return isLangRoute;
}

export { getNextProjectConfig, isLocalePath };
