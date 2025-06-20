/**
 * Dev Command - Local development environment for edge functions
 *
 * This command starts a local development server that simulates the Azion edge environment,
 * allowing you to test your edge functions and applications locally before deployment.
 * It provides hot reloading, debugging capabilities, and mimics edge runtime behavior.
 *
 * @description
 * The dev command creates a local HTTP server that:
 * 1. Loads your built edge function code
 * 2. Simulates the Azion edge runtime environment
 * 3. Provides request/response handling like the edge
 * 4. Supports hot reloading during development
 * 5. Offers debugging and logging capabilities
 *
 * @examples
 *
 * === BASIC USAGE ===
 *
 * # Start dev server with default settings
 * ef dev
 * # Uses: .edge/worker.dev.js on port 3333
 *
 * # Start with custom entry file
 * ef dev ./custom-worker.js
 * ef dev .edge/functions/handler.dev.js
 *
 * # Start on custom port
 * ef dev -p 8080
 * ef dev --port 4000
 *
 * # Start with experimental features
 * ef dev -x
 * ef dev --experimental
 *
 * === COMMON WORKFLOWS ===
 *
 * # Build and immediately test locally
 * ef build -p react && ef dev
 *
 * # Build in dev mode and start server
 * ef build -d && ef dev
 *
 * # Custom build with immediate testing
 * ef build -e ./src/api.ts -p typescript && ef dev
 *
 * # Test with custom port
 * ef build -p vue && ef dev -p 8080
 *
 * === ADVANCED DEVELOPMENT ===
 *
 * # Development with experimental features
 * ef build -x && ef dev -x
 *
 * # Custom entry and port
 * ef dev ./my-custom-worker.js -p 5000
 *
 * # Test specific built function
 * ef build -e ./src/auth.ts && ef dev .edge/functions/auth.dev.js
 *
 * === TESTING DIFFERENT SCENARIOS ===
 *
 * # Test API endpoints
 * ef build -p javascript && ef dev
 * curl http://localhost:3333/api/users
 *
 * # Test static sites
 * ef build -p html && ef dev
 * open http://localhost:3333
 *
 * # Test React app
 * ef build -p react && ef dev -p 8080
 * open http://localhost:8080
 *
 * # Test with different frameworks
 * ef build -p next && ef dev      # Next.js
 * ef build -p vue && ef dev       # Vue.js
 * ef build -p astro && ef dev     # Astro
 *
 * === DEBUGGING AND DEVELOPMENT ===
 *
 * # Run with experimental debugging
 * ef dev -x
 *
 * # Test multiple functions (build each separately)
 * ef build -e ./src/auth.ts && ef dev .edge/auth.dev.js -p 3001 &
 * ef build -e ./src/api.ts && ef dev .edge/api.dev.js -p 3002 &
 *
 * # Test and monitor
 * ef build -d && ef dev | grep -i error
 *
 * === INTEGRATION EXAMPLES ===
 *
 * # Complete development cycle
 * ef config create -k "build.preset" -v "typescript"
 * ef build -d
 * ef dev
 *
 * # Test configuration changes
 * ef config update -k "build.polyfills" -v "false"
 * ef build && ef dev
 *
 * # Generate and test with manifest
 * ef build -p react
 * ef manifest generate
 * ef dev
 *
 * @server_features
 * - HTTP server on specified port (default: 3333)
 * - Edge runtime simulation with FetchEvent interface
 * - Support for Request/Response Web APIs
 * - Hot reloading capability during development
 * - Error handling and debugging information
 * - Console logging and request monitoring
 *
 * @development_workflow
 * 1. Build your project: `ef build -p <preset>`
 * 2. Start dev server: `ef dev`
 * 3. Test in browser: `http://localhost:3333`
 * 4. Make code changes
 * 5. Rebuild: `ef build`
 * 6. Server automatically reloads
 * 7. Test changes immediately
 *
 * @notes
 * - Always build your project before starting the dev server
 * - The dev server looks for .dev.js files in .edge/ directory
 * - Use development builds (-d) for faster rebuilds during development
 * - The server simulates edge runtime but may have minor differences
 * - Console.log outputs appear in the terminal running the dev server
 * - Use different ports to run multiple functions simultaneously
 * - Experimental features may change behavior and enable new capabilities
 *
 * @function devCommand
 * @description A command to start the development server.
 * This function takes an options object containing the entry point and port number.
 * @example
 *
 * devCommand({ entry: './path/to/entry.js', port: '3000' });
 */
export async function devCommand({
  entry,
  port,
  skipProjectBuild = false,
}: {
  entry?: string;
  port: string;
  skipProjectBuild?: boolean;
}) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');

  const entryPoint = entry || null;

  server(entryPoint, parsedPort, skipProjectBuild);
}
