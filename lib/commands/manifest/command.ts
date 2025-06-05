import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { generateManifest, transformManifest } from './manifest';
import { AzionConfig } from 'azion/config';
import { rm } from 'fs/promises';
import { DIRECTORIES, DOCS_MESSAGE } from '#constants';

export enum ManifestAction {
  GENERATE = 'generate',
  TRANSFORM = 'transform',
}

export interface ManifestCommandOptions {
  action?: ManifestAction | string;
  entry?: string;
  config?: AzionConfig;
  output?: string;
}

/**
 * Manifest Command - Generate deployment manifests for Azion platform
 *
 * This command generates manifest files required for deploying edge functions and static assets
 * to the Azion platform. It analyzes your build configuration and creates deployment descriptors
 * that define how your application should be deployed and served from the edge.
 *
 * @description
 * The manifest command performs the following operations:
 * 1. Reads configuration from azion.config.js or provided config file
 * 2. Analyzes built assets in the output directory
 * 3. Generates manifest.json with deployment instructions
 * 4. Creates static asset mappings and routing rules
 * 5. Defines edge function configurations and bindings
 * 6. Sets up cache policies and delivery rules
 *
 * Available subcommands:
 * - generate: Create manifest files for deployment
 * - validate: Check manifest structure and configuration
 * - clean: Remove generated manifest files
 *
 * @examples
 *
 * === BASIC MANIFEST GENERATION ===
 *
 * # Generate manifest from default config
 * ef manifest generate
 * # Uses: azion.config.js, outputs to .edge/
 *
 * # Generate with custom config file
 * ef manifest generate -e ./custom.config.js
 * ef manifest generate --entry ./deploy.config.js
 *
 * # Generate to custom output directory
 * ef manifest generate -o ./dist
 * ef manifest generate --out ./build
 *
 * # Generate with both custom config and output
 * ef manifest generate -e ./prod.config.js -o ./deploy
 *
 * === FRAMEWORK-SPECIFIC MANIFESTS ===
 *
 * # React application manifest
 * ef build -p react
 * ef manifest generate
 *
 * # Next.js application manifest
 * ef build -p next
 * ef manifest generate -o ./out
 *
 * # Vue.js application manifest
 * ef build -p vue
 * ef manifest generate -e ./vue.config.js
 *
 * # Static site manifest
 * ef build -p html
 * ef manifest generate -o ./public
 *
 * # TypeScript project manifest
 * ef build -p typescript
 * ef manifest generate
 *
 * === VALIDATION OPERATIONS ===
 *
 * # Validate existing manifest
 * ef manifest validate
 *
 * # Validate custom manifest file
 * ef manifest validate -e ./manifest.json
 *
 * # Validate manifest in custom directory
 * ef manifest validate -o ./deploy
 *
 * === CLEANUP OPERATIONS ===
 *
 * # Clean default manifest files
 * ef manifest clean
 *
 * # Clean manifests in custom directory
 * ef manifest clean -o ./dist
 *
 * # Clean all generated files
 * ef manifest clean --all
 *
 * === ADVANCED CONFIGURATION ===
 *
 * # Generate with verbose output
 * ef manifest generate --verbose
 *
 * # Generate for specific environment
 * ef manifest generate --env production
 * ef manifest generate --env staging
 *
 * # Generate with custom domain
 * ef manifest generate --domain myapp.example.com
 *
 * # Generate with specific version
 * ef manifest generate --version 1.2.3
 *
 * === DEPLOYMENT WORKFLOWS ===
 *
 * # Complete deployment preparation
 * ef config create -k "edgeApplications[0].name" -v "My App"
 * ef build -p react
 * ef manifest generate
 * # Ready for deployment!
 *
 * # Multi-environment workflow
 * ef build -p typescript
 * ef manifest generate -e ./staging.config.js -o ./staging
 * ef manifest generate -e ./prod.config.js -o ./production
 *
 * # Validate before deployment
 * ef build -p vue
 * ef manifest generate
 * ef manifest validate
 *
 * === INTEGRATION EXAMPLES ===
 *
 * # Build and generate in one step
 * ef build -p next && ef manifest generate
 *
 * # Full development to deployment cycle
 * ef config create -k "build.preset" -v "typescript"
 * ef build
 * ef dev  # Test locally
 * # Ctrl+C to stop dev server
 * ef manifest generate
 *
 * # Custom configuration workflow
 * ef config create -k "edgeApplications[0]" -v '{
 *   "name": "Production App",
 *   "edgeCacheEnabled": true,
 *   "edgeFunctionsEnabled": true
 * }'
 * ef build -p react
 * ef manifest generate -o ./deploy
 *
 * === MANIFEST STRUCTURE ===
 *
 * Generated manifest includes:
 * - Application metadata (name, version, description)
 * - Edge function definitions and entry points
 * - Static asset mappings and MIME types
 * - Routing rules and URL patterns
 * - Cache policies and TTL settings
 * - Security headers and CORS configuration
 * - Environment variables and secrets
 * - Domain bindings and SSL settings
 *
 * @outputs
 * Default generation creates:
 * - .edge/manifest.json - Main deployment manifest
 * - .edge/functions/ - Edge function artifacts
 * - .edge/static/ - Static asset mappings
 * - .edge/routes.json - Routing configuration
 *
 * @validation_checks
 * The validate command checks:
 * - Manifest JSON schema compliance
 * - Required fields presence
 * - File path references validity
 * - Configuration consistency
 * - Deployment readiness
 *
 * @notes
 * - Always build your project before generating manifests
 * - Manifest generation requires azion.config.js or custom config
 * - Generated files are platform-specific for Azion deployment
 * - Validation helps catch configuration issues before deployment
 * - Clean command removes all generated manifest files
 * - Custom output directories must exist before generation
 * - Environment-specific manifests enable multi-stage deployments
 *
 * @function manifestCommand
 * @description
 * Manages manifest operations for generation and transformation.
 *
 * Usage:
 * ```bash
 * az manifest transform --entry=<input.json> --output=<output.js>
 * az manifest generate --entry=<input.config.js> --output=<output.dir>
 * az manifest --entry=<input.config.js> --output=<output.dir>
 * ```
 */
export async function manifestCommand(options: ManifestCommandOptions): Promise<void> {
  try {
    const action =
      options.action || (options.config ? ManifestAction.GENERATE : ManifestAction.TRANSFORM);

    const actionHandlers = {
      [ManifestAction.GENERATE]: async () => {
        const input = options.entry || options.config;
        await generateManifest(input, options.output);
      },

      [ManifestAction.TRANSFORM]: async () => {
        await transformManifest(options.entry, options.output);
      },
    };

    // Execute the appropriate handler or show error
    const handler = actionHandlers[action as ManifestAction];

    if (handler) {
      await handler();
    }
    if (!handler) {
      feedback.manifest.error(
        `Only ${ManifestAction.TRANSFORM} and ${ManifestAction.GENERATE} actions are supported`,
      );
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(error);
    feedback.error(`${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`);
    await rm(DIRECTORIES.OUTPUT_BASE_PATH, { recursive: true, force: true });
    process.exit(1);
  }
}
