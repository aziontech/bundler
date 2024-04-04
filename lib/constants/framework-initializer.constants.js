import { exec } from '#utils';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const FrameworksDefaultVersions = {
  Angular: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Astro: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Hexo: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Next: {
    options: [
      { value: '12.3.1', message: 'SSR supported' },
      { value: 'latest', message: 'static supported' },
    ],
  },
  React: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Svelte: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Vue: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
  Vite: {
    options: [{ value: 'latest', message: 'static supported' }],
  },
};
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
 * @property {Function} Svelte - Initializes a new React project.
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
const FrameworkInitializer = {
  JavaScript: async (projectName) => {
    const projectPath = join(process.cwd(), projectName);
    mkdirSync(projectPath);

    const workerContent = `
export default function myWorker(event) {
  return new Response('Hello World');
}
    `;

    writeFileSync(join(projectPath, 'main.js'), workerContent.trim());
  },
  TypeScript: async (projectName) => {
    const projectPath = join(process.cwd(), projectName);
    mkdirSync(projectPath);

    const content = `
export default function myWorker(event: FetchEvent): Response {
  return new Response('Hello World');
}`;
    const vulcanFile = `preset=typescript\nentry=main.ts\n`;

    writeFileSync(join(projectPath, '.vulcan'), vulcanFile);
    writeFileSync(join(projectPath, 'main.ts'), content.trim());
  },
  Angular: async (projectName, version = FrameworksDefaultVersions.Angular) => {
    await exec(
      `npx --yes @angular/cli@${version} new ${projectName}`,
      'Angular',
      false,
      true,
    );
  },
  Astro: async (projectName, version = FrameworksDefaultVersions.Astro) => {
    await exec(
      `npx --yes create-astro@${version} ${projectName}`,
      'Astro',
      false,
      true,
    );
  },
  Hexo: async (projectName, version = FrameworksDefaultVersions.Hexo) => {
    await exec(
      `npx --yes hexo@${version} init ${projectName}`,
      'Hexo',
      false,
      true,
    );
  },
  Next: async (projectName, version = FrameworksDefaultVersions.Next) => {
    await exec(
      `npx --yes create-next-app@${version} ${projectName} && cd ${projectName} && npm i next@${version}`,
      'Next',
      false,
      true,
    );
  },
  React: async (projectName, version = FrameworksDefaultVersions.React) => {
    await exec(
      `npx --yes create-react-app@${version} ${projectName}`,
      'React',
      false,
      true,
    );
  },
  Svelte: async (projectName, version = FrameworksDefaultVersions.Svelte) => {
    await exec(
      `npm create svelte@${version} ${projectName}`,
      'Svelte',
      false,
      true,
    );
  },
  Vue: async (projectName, version = FrameworksDefaultVersions.Vue) => {
    await exec(
      `npx --yes @vue/cli@${version} create ${projectName}`,
      'Vue',
      false,
      true,
    );
  },
  Vite: async (projectName, version = FrameworksDefaultVersions.Vite) => {
    await exec(
      `npx --yes create-vue@${version} ${projectName}`,
      'Vue/Vite',
      false,
      true,
    );
  },
};

export { FrameworkInitializer, FrameworksDefaultVersions };
