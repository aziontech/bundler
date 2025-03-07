import { readFile } from 'fs/promises';
import { BuildConfiguration, BuildContext } from 'azion/config';
import { transpileTypescript } from './utils';

const WORKER_TEMPLATES = {
  fetch: (handler: string) =>
    `addEventListener('fetch', (event) => { event.respondWith((async function(event) {
      ${handler}
    })(event));});`,
  firewall: (handler: string) =>
    `addEventListener('firewall', (event) => {
      (async function(event) {
        ${handler}
      })(event);
    });`,
};

export const getWorkerTemplate = (
  handler: string,
  event: 'firewall' | 'fetch',
): string => {
  return WORKER_TEMPLATES[event](handler);
};

export const setupWorkerCode = async (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): Promise<string> => {
  if (buildConfig.worker) return readFile(ctx.entrypoint, 'utf-8');

  const sourceCode = await readFile(ctx.entrypoint, 'utf-8');
  const moduleCode =
    buildConfig.preset.metadata.ext === '.ts'
      ? transpileTypescript(sourceCode)
      : sourceCode;

  const tempUrl =
    'data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64');
  const module = await import(tempUrl);

  const handler = module[ctx.event] || module.default?.[ctx.event];

  if (!handler) {
    throw new Error(`Handler for ${ctx.event} not found in module`);
  }

  return getWorkerTemplate(handler.toString(), ctx.event);
};
