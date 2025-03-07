export const createEventHandlerCode = (entrypoint: string): string => {
  return `
import module from '${entrypoint}';

const hasFirewallHandler = module.firewall || module.default?.firewall;

const eventType = hasFirewallHandler ? 'firewall' : 'fetch';
const handler = module[eventType] || module.default?.[eventType];

if (!handler) {
  throw new Error("Handler not found in module");
}

addEventListener(eventType, (event) => {
  if (eventType === 'fetch') {
    event.respondWith((async function() {
      try {
        return handler(event);
      } catch (error) {
        return new Response(\`Error: \${error.message}\`, { status: 500 });
      }
    })());
  } else {
    (async function() {
      try {
        return handler(event);
      } catch (error) {
        return new Response(\`Error: \${error.message}\`, { status: 500 });
      }
    })();
  }
});
`;
};
