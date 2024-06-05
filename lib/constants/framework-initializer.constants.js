import { exec } from '#utils';

const generateCloneCommand = (projectName, subdirectory) => {
  const fullPath = `templates/${subdirectory}`;

  return `
mkdir ${projectName}
cd ${projectName}
git init
git remote add -f origin https://github.com/aziontech/vulcan-examples.git > /dev/null 2>&1
git config core.sparseCheckout true
echo "${fullPath}/*" >> .git/info/sparse-checkout
git pull origin main > /dev/null 2>&1
mv ${fullPath}/* ./
rm -rf templates .git
`.trim();
};

const TemplatesOptions = {
  JavaScript: {
    options: [
      {
        value: 'javascript/simple-js-router',
        message: 'Simple JS Router',
        mode: 'compute',
      },
      {
        value: 'javascript/simple-js-node',
        message: 'Simple Node.js with Polyfills',
        mode: 'compute',
      },
    ],
  },
  TypeScript: {
    options: [{ value: 'typescript/simple-ts-router', mode: 'compute' }],
  },
  Angular: {
    options: [
      { value: 'angular-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Astro: {
    options: [
      { value: 'astro-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Gatsby: {
    options: [
      { value: 'gatsby-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Hexo: {
    options: [
      { value: 'hexo-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Jekyll: {
    options: [
      { value: 'jekyll-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Next: {
    options: [
      {
        value: 'nextjs/next-13-static',
        message: 'Next 13 - Static (export)',
        mode: 'deliver',
      },
      {
        value: 'nextjs/edge-app-13-5-6',
        message: 'Next 13 - Edge Runtime (App Router) ',
        mode: 'compute',
      },
      {
        value: 'nextjs/edge-pages-13-5-6',
        message: 'Next 13 - Edge Runtime (Pages Router)',
        mode: 'compute',
      },
      {
        value: 'nextjs/node-pages-12-3-1',
        message: 'Next 12 - Node Runtime (Edge compatible with polyfills)',
        mode: 'compute',
      },
    ],
  },
  React: {
    options: [
      { value: 'react-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Svelte: {
    options: [
      { value: 'svelte-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Vue: {
    options: [
      { value: 'vue-static', message: 'static supported', mode: 'deliver' },
    ],
  },
  Vite: {
    options: [
      {
        value: 'vue3-vite-static',
        message: 'static supported',
        mode: 'deliver',
      },
    ],
  },
  Emscripten: {
    options: [{ value: 'emscripten-wasm', mode: 'compute' }],
  },
  Rustwasm: {
    options: [{ value: 'rust-wasm-yew-ssr', mode: 'compute' }],
  },
  Eleventy: {
    options: [
      {
        value: 'eleventy-static',
        message: 'static supported',
        mode: 'deliver',
      },
    ],
  },
};

const TemplatesInitializer = {
  JavaScript: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'JavaScript', false, false);
  },
  TypeScript: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'TypeScript', false, false);
  },
  Rustwasm: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'RustWasm', false, false);
  },
  Emscripten: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Emscripten', false, false);
  },
  Angular: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Angular', false, false);
  },
  Astro: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Astro', false, false);
  },
  Gatsby: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Gatsby', false, false);
  },
  Hexo: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Hexo', false, false);
  },
  Jekyll: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Jekyll', false, false);
  },
  Next: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Next', false, false);
  },
  React: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'React', false, false);
  },
  Svelte: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Svelte', false, false);
  },
  Vue: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Vue', false, false);
  },
  Vite: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Vite', false, false);
  },
  Eleventy: async (projectName, subdirectory) => {
    const cloneCommands = generateCloneCommand(projectName, subdirectory);
    await exec(cloneCommands, 'Eleventy', false, false);
  },
};

export { TemplatesInitializer, TemplatesOptions };
