import { feedback } from 'azion/utils/node';
import { getBeautify, getKeys, getPresetConfig } from './presets';

/**
 * Presets Command - Framework and language preset management
 *
 * This command provides access to pre-configured build settings for popular frameworks
 * and programming languages, making it easy to set up projects with optimal configurations
 * for edge deployment on the Azion platform.
 *
 * @description
 * The presets command offers two main functionalities:
 * 1. ls - List all available presets with descriptions
 * 2. config - Get detailed configuration for a specific preset
 *
 * Available subcommands:
 * - ls: List all available presets
 * - config: Show configuration details for a specific preset
 *
 * @examples
 *
 * === LISTING PRESETS ===
 *
 * # List all available presets
 * ef presets ls
 * ef presets list
 *
 * # Output shows all frameworks and languages with descriptions:
 * # javascript - Basic JavaScript configuration
 * # typescript - TypeScript with type checking
 * # react - React application with JSX support
 * # vue - Vue.js framework configuration
 * # angular - Angular framework with CLI integration
 * # next - Next.js with SSR/SSG support
 * # nuxt - Nuxt.js Vue-based framework
 * # svelte - Svelte framework configuration
 * # astro - Astro static site generator
 * # gatsby - Gatsby React-based framework
 * # html - Static HTML sites
 * # rustwasm - Rust compiled to WebAssembly
 * # emscripten - C/C++ compiled to WebAssembly
 *
 * === GETTING PRESET CONFIGURATIONS ===
 *
 * # Get JavaScript preset configuration
 * ef presets config javascript
 *
 * # Get TypeScript preset configuration
 * ef presets config typescript
 *
 * # Get React preset configuration
 * ef presets config react
 *
 * # Get Vue.js preset configuration
 * ef presets config vue
 *
 * # Get Next.js preset configuration
 * ef presets config next
 *
 * # Get static HTML preset configuration
 * ef presets config html
 *
 * === FRAMEWORK-SPECIFIC EXAMPLES ===
 *
 * # Check React configuration before building
 * ef presets config react
 * ef build -p react
 *
 * # Compare TypeScript configurations
 * ef presets config typescript
 * ef presets config javascript
 *
 * # Get Vue.js configuration details
 * ef presets config vue
 * # Shows bundler, plugins, optimization settings
 *
 * # Check Next.js specific settings
 * ef presets config next
 * # Shows SSR/SSG, routing, optimization configs
 *
 * === INTEGRATION WITH BUILD WORKFLOW ===
 *
 * # Explore preset before using it
 * ef presets config angular
 * ef build -p angular
 *
 * # Compare different framework options
 * ef presets config react
 * ef presets config vue
 * ef presets config svelte
 * # Choose the best fit for your project
 *
 * # Check WebAssembly options
 * ef presets config rustwasm
 * ef presets config emscripten
 *
 * === CONFIGURATION INSPECTION ===
 *
 * # Get detailed configuration for decision making
 * ef presets config typescript | jq .
 * ef presets config react | jq '.bundler'
 * ef presets config vue | jq '.plugins'
 *
 * # Save configuration for reference
 * ef presets config next > next-config.json
 * ef presets config astro > astro-config.json
 *
 * === TROUBLESHOOTING ===
 *
 * # Check if preset exists
 * ef presets ls | grep "myframework"
 *
 * # Get help for available presets
 * ef presets ls
 * # If preset not found, this shows alternatives
 *
 * # Verify preset before build
 * ef presets config react
 * # Check configuration before: ef build -p react
 *
 * @preset_categories
 *
 * **Frontend Frameworks:**
 * - react: React with JSX/TSX support and hot reloading
 * - vue: Vue.js with single-file components and Vite integration
 * - angular: Angular with TypeScript and Angular CLI integration
 * - svelte: Svelte with SvelteKit and fast compilation
 *
 * **Full-Stack Frameworks:**
 * - next: Next.js with SSR, SSG, API routes, and optimization
 * - nuxt: Nuxt.js with Vue ecosystem and server-side features
 * - astro: Astro with islands architecture and multi-framework support
 * - gatsby: Gatsby with GraphQL and static site generation
 *
 * **Languages:**
 * - javascript: Modern JavaScript with ES modules and polyfills
 * - typescript: TypeScript with strict type checking and compilation
 *
 * **Static Sites:**
 * - html: Static HTML with asset optimization and bundling
 *
 * **WebAssembly:**
 * - rustwasm: Rust compiled to WebAssembly with wasm-pack
 * - emscripten: C/C++ compiled to WebAssembly with Emscripten
 *
 * @configuration_details
 * Each preset includes:
 * - Bundler configuration (esbuild, webpack, vite)
 * - Framework-specific plugins and transformations
 * - Optimization settings for production builds
 * - Development server configurations
 * - Asset handling and static file processing
 * - Environment variable management
 * - Source map generation settings
 * - Polyfill configurations for edge compatibility
 *
 * @usage_patterns
 *
 * 1. **Exploration**: Use `ef presets ls` to see all options
 * 2. **Investigation**: Use `ef presets config <preset>` to understand settings
 * 3. **Implementation**: Use `ef build -p <preset>` to build with preset
 * 4. **Customization**: Copy preset config to azion.config.js for modifications
 *
 * @notes
 * - Presets are optimized for Azion edge deployment
 * - All presets include polyfills for edge runtime compatibility
 * - Configuration shows both default and customizable options
 * - Presets are regularly updated to match framework best practices
 * - Custom presets can be created by extending existing configurations
 * - Use preset configurations as starting points for complex projects
 * - Preset names are case-sensitive and must match exactly

 * @function
 * @description Manages presets for the application.
 * This command allows the user to create or list presets.
 * The user is guided by a series of prompts to enter a preset name.
 * @example
 * // To list existing presets
 * presetsCommand('ls');
 *
 * // To get config of a specific preset
 * presetsCommand('config', { preset: 'react' });
 */
export async function presetsCommand(command: string, options: { preset?: string } = {}) {
  const isCleanOutputEnabled = process.env.CLEAN_OUTPUT_MODE === 'true';

  switch (command) {
    case 'ls':
      if (isCleanOutputEnabled) {
        getKeys().forEach((preset: string) => console.log(preset));
      }
      if (!isCleanOutputEnabled) {
        getBeautify().forEach((preset: string) => feedback.option(preset));
      }
      break;

    case 'config':
      if (!options.preset) {
        feedback.error('Preset name is required. Use: ef presets config <preset-name>');
        return;
      }

      try {
        const config = getPresetConfig(options.preset);
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        feedback.error(error instanceof Error ? error.message : 'Unknown error occurred');
      }
      break;

    default:
      feedback.error('Invalid argument provided. Available commands: ls, config');
      break;
  }
}
