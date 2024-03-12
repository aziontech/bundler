import { exec } from '#utils';

const generateCloneCommand = (projectName, subdirectory) => {
  return `
mkdir ${projectName}
cd ${projectName}
git init
git remote add -f origin https://github.com/aziontech/vulcan-examples.git > /dev/null 2>&1
git config core.sparseCheckout true
echo "${subdirectory}/*" >> .git/info/sparse-checkout
git pull origin main > /dev/null 2>&1
mv ${subdirectory}/* ./
rm -rf ${subdirectory} .git
`.trim();
};

const TemplatesOptions = {
  // JavaScript: [{}],
  TypeScript: {
    options: [{ value: 'simple-ts-esm' }],
  },
  Angular: {
    options: [{ value: 'angular-static', message: 'static supported' }],
  },
  Astro: {
    options: [{ value: 'astro-static', message: 'static supported' }],
  },
  Gatsby: {
    options: [{ value: 'gatsby-static', message: 'static supported' }],
  },
  Hexo: {
    options: [{ value: 'hexo-static', message: 'static supported' }],
  },
  Next: {
    options: [
      // { value: 'next-ssr', message: 'SSR supported' },
      // { value: 'next-static', message: 'static supported' },
    ],
  },
  React: {
    options: [{ value: 'react-static', message: 'static supported' }],
  },
  Vue: {
    options: [{ value: 'vue-static', message: 'static supported' }],
  },
  Vite: {
    options: [{ value: 'vite-static', message: 'static supported' }],
  },
  'C++': {
    options: [{ value: 'emscripten-wasm-static' }],
  },
  Rust: {
    options: [{ value: 'rust-wasm-yew-ssr' }],
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
    // Assume que a primeira opção é a desejada, ajuste conforme necessário
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
