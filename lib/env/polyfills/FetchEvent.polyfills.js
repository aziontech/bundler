import primitives from '@edge-runtime/primitives';
import { feedback } from '#utils';

class FetchEventPolyfill extends primitives.FetchEvent {
  constructor(request) {
    super(request);
    this.console = {
      log: (log) => feedback.server.log(log),
    };
  }
}

export default FetchEventPolyfill;
