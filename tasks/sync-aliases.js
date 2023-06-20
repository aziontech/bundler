import fs from 'fs';
import path from 'path';
import { feedback } from '#utils';
import myAliases from '../aliases.js';

const convertAliasFormat = (aliases) => {
  const convertedAliases = {};

  aliases.forEach(([alias, filePath]) => {
    convertedAliases[alias] = filePath;
  });

  return convertedAliases;
};

const convertedAliases = convertAliasFormat(myAliases);

const packageJsonPath = path.resolve('./', 'package.json');
const eslintJsonPath = path.resolve('./', '.eslintrc.json');
const jsconfigPath = path.resolve('./', 'jsconfig.json');

const updatePackageJson = () => {
  fs.readFile(packageJsonPath, 'utf-8', (errRead, data) => {
    if (errRead) {
      feedback.error('Error reading package.json file:', errRead);
      return;
    }

    try {
      const packageJson = JSON.parse(data);

      packageJson.imports = convertedAliases;
      const updatedPackageJson = JSON.stringify(packageJson, null, 2);

      fs.writeFile(packageJsonPath, updatedPackageJson, 'utf-8', (errWrite) => {
        if (errWrite) {
          feedback.error('Error updating package.json file:', errWrite);
          return;
        }

        feedback.success('Aliases successfully updated in package.json file.');
      });
    } catch (err) {
      feedback.error('Error parsing package.json file:', err);
    }
  });
};

// Função para atualizar o eslint.json
const updateEslintJson = () => {
  fs.readFile(eslintJsonPath, 'utf-8', (errRead, data) => {
    if (errRead) {
      feedback.error('Error reading eslint.json file:', errRead);
      return;
    }

    try {
      const eslintJson = JSON.parse(data);

      eslintJson.settings = eslintJson.settings || {};
      eslintJson.settings['import/resolver'] = eslintJson.settings['import/resolver'] || {};
      eslintJson.settings['import/resolver'].alias = eslintJson.settings['import/resolver'].alias || {};
      eslintJson.settings['import/resolver'].alias.map = myAliases;

      const updatedEslintJson = JSON.stringify(eslintJson, null, 2);

      fs.writeFile(eslintJsonPath, updatedEslintJson, 'utf-8', (errWrite) => {
        if (errWrite) {
          feedback.error('Error updating eslint.json file:', errWrite);
          return;
        }

        feedback.success('Aliases successfully updated in eslint.json file.');
      });
    } catch (err) {
      feedback.error('Error parsing eslint.json file:', err);
    }
  });
};

const updateJsconfigJson = () => {
  fs.readFile(jsconfigPath, 'utf-8', (errRead, data) => {
    if (errRead) {
      feedback.error('Error reading jsconfig.json file:', errRead);
      return;
    }

    try {
      const jsconfigJson = JSON.parse(data);

      jsconfigJson.compilerOptions = jsconfigJson.compilerOptions || {};
      jsconfigJson.compilerOptions.paths = {};

      myAliases.forEach(([alias, filePath]) => {
        jsconfigJson.compilerOptions.paths[alias] = [filePath];
      });

      const updatedJsconfigJson = JSON.stringify(jsconfigJson, null, 2);

      fs.writeFile(jsconfigPath, updatedJsconfigJson, 'utf-8', (errWrite) => {
        if (errWrite) {
          feedback.error('Error updating jsconfig.json file:', errWrite);
          return;
        }

        feedback.success('Aliases successfully updated in jsconfig.json file.');
      });
    } catch (err) {
      feedback.error('Error parsing jsconfig.json file:', err);
    }
  });
};
updatePackageJson();
updateEslintJson();
updateJsconfigJson();
