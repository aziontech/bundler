import build from './build.messages.js';
import env from './env.messages.js';
import global from './global.messages.js'; // generic messages

const Messages = {
  env,
  build,
  ...global,
};

export default Messages;
