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
    options: [{ value: 'typescript/simple-ts-esm', mode: 'compute' }],
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
  Next: {
    options: [
      {
        value: 'next-13-static',
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
  'C++': {
    options: [{ value: 'emscripten-wasm-static', mode: 'compute' }],
  },
  Rust: {
    options: [{ value: 'rust-wasm-yew-ssr', mode: 'compute' }],
  },
};

const TemplatesInitializer = {
  JavaScript: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Angular.options[0].value,
    );
    await exec(cloneCommands, 'JavaScript', false, true);
  },
  TypeScript: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Angular.options[0].value,
    );
    await exec(cloneCommands, 'TypeScript', false, true);
  },
  Rust: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Angular.options[0].value,
    );
    await exec(cloneCommands, 'Rust', false, true);
  },
  'C++': async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Angular.options[0].value,
    );
    await exec(cloneCommands, 'C++', false, true);
  },
  Angular: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Angular.options[0].value,
    );
    await exec(cloneCommands, 'Angular', false, false);
  },
  Astro: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Astro.options[0].value,
    );
    await exec(cloneCommands, 'Astro', false, true);
  },
  Gatsby: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Gatsby.options[0].value,
    );
    await exec(cloneCommands, 'Gatsby', false, true);
  },
  Hexo: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Hexo.options[0].value,
    );
    await exec(cloneCommands, 'Hexo', false, true);
  },
  Next: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Next.options[0].value,
    );
    await exec(cloneCommands, 'Next', false, true);
  },
  React: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.React.options[0].value,
    );
    await exec(cloneCommands, 'React', false, true);
  },
  Vue: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Vue.options[0].value,
    );
    await exec(cloneCommands, 'Vue', false, true);
  },
  Vite: async (projectName) => {
    const cloneCommands = generateCloneCommand(
      projectName,
      TemplatesOptions.Vite.options[0].value,
    );
    await exec(cloneCommands, 'Vite', false, true);
  },
};

export { TemplatesInitializer, TemplatesOptions };
