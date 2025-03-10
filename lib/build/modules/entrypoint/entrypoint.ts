import { AzionBuildPreset, AzionConfig } from 'azion/config';
import { feedback } from 'azion/utils/node';
import { join, dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

interface EntrypointOptions {
  entrypoint?: string;
  preset: AzionBuildPreset;
  userConfig: AzionConfig;
}

// Obtém o caminho base do bundler
const bundlerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../');

/**
 * Resolves the entrypoint based on priority:
 * 1. User-defined entrypoint
 * 2. Preset handler
 * 3. Preset default entry config
 */
export const resolveEntrypoint = async ({
  entrypoint,
  preset,
  userConfig,
}: EntrypointOptions): Promise<string> => {
  // Prioridade 1: Entrypoint definido pelo usuário
  if (entrypoint && existsSync(entrypoint)) {
    feedback.build.info(`Using ${entrypoint} as entry point.`);
    return entrypoint;
  }

  // Prioridade 2: Handler do preset
  if (preset.handler) {
    feedback.build.info(
      `Using built-in handler from "${preset.metadata.name}" preset.`,
    );

    // Procura o handler nas dependências do bundler
    const handlerPath = resolve(
      bundlerRoot,
      'node_modules',
      'azion',
      'packages',
      'presets',
      'src',
      'presets',
      preset.metadata.name,
      'handler.ts',
    );

    if (existsSync(handlerPath)) {
      return handlerPath;
    }

    throw new Error(
      `Handler file not found for preset "${preset.metadata.name}" at ${handlerPath}`,
    );
  }

  // Prioridade 3: Entrada padrão do preset
  if (preset.config?.build?.entry) {
    const presetEntry = preset.config.build.entry;
    const entryPath = resolve(presetEntry);

    if (existsSync(entryPath)) {
      feedback.build.info(`Using preset default entry: ${presetEntry}`);
      return entryPath;
    }

    throw new Error(
      `Preset "${preset.metadata.name}" default entry file not found: ${presetEntry}`,
    );
  }

  // Se chegou até aqui, não foi possível resolver o entrypoint
  throw new Error(
    `Cannot determine entry point. Please specify one using --entry or in your configuration.`,
  );
};
