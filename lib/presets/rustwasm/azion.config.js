/**
 * NOTE: We are gradually migrating all configurations to the Azion library
 * through the azion/presets package (@https://github.com/aziontech/lib/tree/main/packages/presets).
 * This helps standardize our setup and maintain consistency across projects.
 */

import { RustWasm } from 'azion/presets';

const { config } = RustWasm;

export default config;
