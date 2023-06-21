import build from './build.messages.js';
import env from './env.messages.js';
import platform from './platform.messages.js';
import global from './global.messages.js'; // generic messages

const Messages = {
  env, platform, build, ...global,
};

export default Messages;
