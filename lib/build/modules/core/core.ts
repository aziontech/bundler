import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import {
  AzionBuild,
  AzionBuildPreset,
  AzionPrebuildResult,
} from 'azion/config';
import { BuildEnv, BuildConfiguration } from 'azion/bundler';
import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
} from 'azion/bundler';
import {
  getExportedFunctionBody,
  relocateImportsAndRequires,
  helperHandlerCode,
} from '#utils';

interface BuildParams {
  buildConfig: AzionBuild;
  preset: AzionBuildPreset;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildEnv;
}

const processPresetHandler = (preset: AzionBuildPreset, config: AzionBuild) => {
  const handlerTemplate = preset.handler.toString();
  const handlerTemplateBody = getExportedFunctionBody(handlerTemplate);

  let newHandlerContent = config.worker
    ? `(async function() {
        ${handlerTemplateBody}
      })()`
    : handlerTemplate;

  if (
    preset.metadata.name === 'javascript' ||
    preset.metadata.name === 'typescript'
  ) {
    const handlerContent = readFileSync(config.entry, 'utf-8');
    const content = config.worker
      ? handlerContent
      : getExportedFunctionBody(handlerContent);
    newHandlerContent = newHandlerContent.replace('__JS_CODE__', content);

    const { matchEvent: isFirewallEvent } =
      helperHandlerCode.checkAndChangeAddEventListener(
        'firewall',
        'firewall',
        newHandlerContent,
        false,
      );

    if (!config.worker && isFirewallEvent) {
      throw new Error('Firewall events are not supported in this context');
    }
  }

  return relocateImportsAndRequires(newHandlerContent);
};

export const executeBuild = async ({
  buildConfig,
  preset,
  prebuildResult,
  ctx,
}: BuildParams) => {
  let buildEntryTemp: string | undefined;

  try {
    buildEntryTemp = buildConfig.entry;
    const processedHandler = processPresetHandler(preset, buildConfig);
    writeFileSync(buildConfig.entry, processedHandler);

    if (prebuildResult.injection.entry) {
      let entryContent = readFileSync(buildConfig.entry, 'utf-8');
      entryContent = `${prebuildResult.injection.entry} ${entryContent}`;
      entryContent = relocateImportsAndRequires(entryContent);
      writeFileSync(buildConfig.entry, entryContent);
    }

    const bundlerConfig: BuildConfiguration = {
      config: buildConfig,
      extras: {
        contentToInject: prebuildResult.injection.banner,
        defineVars: prebuildResult.bundler.defineVars,
      },
    };

    const bundler = buildConfig.bundler?.toLowerCase() || 'webpack';
    switch (bundler) {
      case 'esbuild': {
        const esbuildConfig = createAzionESBuildConfig(bundlerConfig, ctx);
        await executeESBuildBuild(esbuildConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = createAzionWebpackConfig(bundlerConfig, ctx);
        await executeWebpackBuild(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }
  } catch (error) {
    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }
    throw error;
  }
};
