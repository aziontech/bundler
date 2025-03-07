import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { BuildConfiguration, BuildContext } from 'azion/config';
import { createEventHandlerCode } from './templates';

/**
 * Configura o código do worker com base na entrada do usuário
 *
 * @param buildConfig - Configuração de build
 * @param ctx - Contexto de build com informações de entrada/saída
 * @returns O código do worker gerado ou original
 */
export const setupWorkerCode = async (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): Promise<string> => {
  if (!buildConfig.worker) {
    const wrapperCode = createEventHandlerCode(ctx.entrypoint);

    await mkdir(dirname(ctx.output), { recursive: true });

    await writeFile(ctx.output, wrapperCode, 'utf-8');
    return wrapperCode;
  }

  return readFile(ctx.entrypoint, 'utf-8');
};
