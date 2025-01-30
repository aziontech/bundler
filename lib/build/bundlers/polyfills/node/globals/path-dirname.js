/* eslint-disable */
import _process from 'unenv/runtime/node/process/index';
import _path from 'unenv/runtime/node/path/index';
import _global from 'unenv/runtime/polyfill/global-this';
_global.__dirname = _path.dirname(_process.cwd());
export default _global.__dirname;
