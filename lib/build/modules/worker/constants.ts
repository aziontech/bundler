export const WORKER_TEMPLATES = {
  fetch: (handlerCode: string) =>
    `const handler = ${handlerCode};
  
    addEventListener('fetch', (event) => {
      event.respondWith((async function() {
        try {
          return handler(event);
        } catch (error) {
          return new Response(\`Error: \${error.message}\`, { status: 500 });
        }
      })());
    });`,
  firewall: (handlerCode: string) =>
    `const handler = ${handlerCode};
    
    addEventListener('firewall', (event) => {
      (async function() {
        try {
          return handler(event);
        } catch (error) {
          return new Response(\`Error: \${error.message}\`, { status: 500 });
        }
      })();
    });`,
};
