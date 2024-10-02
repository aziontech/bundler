import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import primitives from '@edge-runtime/primitives';
import { feedback } from '#utils';

class FetchEventContext extends primitives.FetchEvent {
  constructor(type, eventInitDict) {
    super(type, eventInitDict);
    const argsPathEnv = globalThis.vulcan.argsPath || 'azion/args.json';
    const argsPath = join(process.cwd(), argsPathEnv);
    if (existsSync(argsPath)) {
      try {
        const args = JSON.parse(readFileSync(argsPath, 'utf8'));
        this.args = args || {};
      } catch (error) {
        feedback.server.error(`Error reading args.json: ${error.message}`);
      }
    }
    this.console = {
      log: (log) => feedback.server.log(log),
    };
  }
}

export default FetchEventContext;
