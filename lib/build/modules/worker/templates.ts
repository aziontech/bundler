export const createEventHandlerCode = (
  entrypoint: string,
  event: 'fetch' | 'firewall',
): string => {
  const respondWithWrapper = event === 'fetch' ? 'event.respondWith(' : '';
  const closeRespondWith = event === 'fetch' ? ')' : '';

  return `
import module from '${entrypoint}';

const handler = module.${event} || module.default?.${event};

if (!handler) {
  throw new Error("Handler for ${event} not found in module");
}

addEventListener('${event}', (event) => {
  ${respondWithWrapper}
  (async function() {
    try {
      return handler(event);
    } catch (error) {
      return new Response(\`Error: \${error.message}\`, { status: 500 });
    }
  })()
  ${closeRespondWith};
});
`;
};
