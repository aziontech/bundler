/**
 *
 */
function unimplemented() {
  throw new Error('Node.js dns is not supported');
}

const promises = {
  lookup: unimplemented,
  lookupService: unimplemented,
  Resolver: unimplemented,
  getServers: unimplemented,
  resolve: unimplemented,
  resolve4: unimplemented,
  resolve6: unimplemented,
  resolveAny: unimplemented,
  resolveCname: unimplemented,
  resolveMx: unimplemented,
  resolveNaptr: unimplemented,
  resolveNs: unimplemented,
  resolvePtr: unimplemented,
  resolveSoa: unimplemented,
  resolveSrv: unimplemented,
  resolveTxt: unimplemented,
  reverse: unimplemented,
  setServers: unimplemented,
};

const dns = {
  lookup: unimplemented,
  lookupService: unimplemented,
  Resolver: unimplemented,
  setServers: unimplemented,
  ADDRCONFIG: null,
  V4MAPPED: null,
  NODATA: null,
  FORMERR: null,
  SERVFAIL: null,
  NOTFOUND: null,
  NOTIMP: null,
  REFUSED: null,
  BADQUERY: null,
  BADNAME: null,
  BADFAMILY: null,
  BADRESP: null,
  CONNREFUSED: null,
  TIMEOUT: null,
  EOF: null,
  FILE: null,
  NOMEM: null,
  DESTRUCTION: null,
  BADSTR: null,
  BADFLAGS: null,
  NONAME: null,
  BADHINTS: null,
  NOTINITIALIZED: null,
  LOADIPHLPAPI: null,
  ADDRGETNETWORKPARAMS: null,
  CANCELLED: null,
  getServers: unimplemented,
  resolve: unimplemented,
  resolve4: unimplemented,
  resolve6: unimplemented,
  resolveAny: unimplemented,
  resolveCname: unimplemented,
  resolveMx: unimplemented,
  resolveNaptr: unimplemented,
  resolveNs: unimplemented,
  resolvePtr: unimplemented,
  resolveSoa: unimplemented,
  resolveSrv: unimplemented,
  resolveTxt: unimplemented,
  reverse: unimplemented,
  promises,
};

const ADDRCONFIG = null;
const V4MAPPED = null;
const NODATA = null;
const FORMERR = null;
const SERVFAIL = null;
const NOTFOUND = null;
const NOTIMP = null;
const REFUSED = null;
const BADQUERY = null;
const BADNAME = null;
const BADFAMILY = null;
const BADRESP = null;
const CONNREFUSED = null;
const TIMEOUT = null;
const EOF = null;
const FILE = null;
const NOMEM = null;
const DESTRUCTION = null;
const BADSTR = null;
const BADFLAGS = null;
const NONAME = null;
const BADHINTS = null;
const NOTINITIALIZED = null;
const LOADIPHLPAPI = null;
const ADDRGETNETWORKPARAMS = null;
const CANCELLED = null;

export {
  ADDRCONFIG,
  ADDRGETNETWORKPARAMS,
  BADFAMILY,
  BADFLAGS,
  BADHINTS,
  BADNAME,
  BADQUERY,
  BADRESP,
  BADSTR,
  CANCELLED,
  CONNREFUSED,
  DESTRUCTION,
  EOF,
  FILE,
  FORMERR,
  LOADIPHLPAPI,
  NODATA,
  NOMEM,
  NONAME,
  NOTFOUND,
  NOTIMP,
  NOTINITIALIZED,
  REFUSED,
  unimplemented as Resolver,
  SERVFAIL,
  TIMEOUT,
  V4MAPPED,
  unimplemented as getServers,
  unimplemented as lookup,
  unimplemented as lookupService,
  promises,
  unimplemented as resolve,
  unimplemented as resolve4,
  unimplemented as resolve6,
  unimplemented as resolveAny,
  unimplemented as resolveCname,
  unimplemented as resolveMx,
  unimplemented as resolveNaptr,
  unimplemented as resolveNs,
  unimplemented as resolvePtr,
  unimplemented as resolveSoa,
  unimplemented as resolveSrv,
  unimplemented as resolveTxt,
  unimplemented as reverse,
  unimplemented as setServers,
};

export default dns;
