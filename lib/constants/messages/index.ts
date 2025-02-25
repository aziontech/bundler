import build from './build';
import env from './env';
import global from './global'; // generic messages

const Messages = {
  env,
  build,
  ...global,
};

export default Messages;
