import build from './build.messages.js';
import env from './env.messages.js';
import init from './init.messages.js';
import global from './global.messages.js'; // generic messages

const Messages = {
  env,
  init,
  build,
  ...global,
};

export default Messages;
