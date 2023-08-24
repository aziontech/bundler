/**
 * FrameworkInitializer contains various methods to initialize new projects
 * in different JavaScript frameworks.
 *
 * Each method is an asynchronous function that takes a `projectName` as an argument.
 * This `projectName` is then used to initialize a new project in the respective framework.
 * @namespace FrameworkInitializer
 * @typedef {object} FrameworkInitializer
 * @property {Function} Angular - Initializes a new Angular project.
 * @property {Function} Astro - Initializes a new Astro project.
 * @property {Function} Hexo - Initializes a new Hexo project.
 * @property {Function} Next - Initializes a new Next.js project.
 * @property {Function} React - Initializes a new React project.
 * @property {Function} Vue - Initializes a new Vue project.
 * @property {Function} Vite - Initializes a new Vue project with Vite.
 * @example
 * const { Angular, React } = FrameworkInitializer;
 *
 * // Initialize a new Angular project called 'myAngularProject'
 * await Angular('myAngularProject');
 *
 * // Initialize a new React project called 'myReactProject'
 * await React('myReactProject');
 */
import { exec } from '#utils';

const FrameworkInitializer = {
  Angular: async (projectName) => {
    await exec(`npx ng new ${projectName}`, 'Angular', false, true);
  },
  Astro: async (projectName) => {
    await exec(`npx create-astro ${projectName}`, 'Astro', false, true);
  },
  Hexo: async (projectName) => {
    await exec(`npx hexo init ${projectName}`, 'Hexo', false, true);
  },
  Next: async (projectName) => {
    await exec(`npx create-next-app ${projectName}`, 'Next', false, true);
  },
  React: async (projectName) => {
    await exec(`npx create-react-app ${projectName}`, 'React', false, true);
  },
  Vue: async (projectName) => {
    await exec(`npx vue create ${projectName}`, 'Vue', false, true);
  },
  Vite: async (projectName) => {
    await exec(`npx create-vue ${projectName}`, 'Vue/Vite', false, true);
  },
};

export default FrameworkInitializer;
