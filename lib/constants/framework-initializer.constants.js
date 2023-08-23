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
  'Vue/Vite': async (projectName) => {
    await exec(`npx create-vue ${projectName}`, 'Vue/Vite', false, true);
  },
};

export default FrameworkInitializer;
