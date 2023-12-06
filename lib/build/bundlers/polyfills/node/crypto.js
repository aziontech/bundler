/* eslint-disable */
import crypto from 'crypto-browserify';

crypto.webcrypto = globalThis.crypto;
export default crypto;
export var { Cipher } = crypto;
export var { Cipheriv } = crypto;
export var { Decipher } = crypto;
export var { Decipheriv } = crypto;
export var { DiffieHellman } = crypto;
export var { DiffieHellmanGroup } = crypto;
export var { Hash } = crypto;
export var { Hmac } = crypto;
export var { Sign } = crypto;
export var { Verify } = crypto;
export var { constants } = crypto;
export var { createCipher } = crypto;
export var { createCipheriv } = crypto;
export var { createCredentials } = crypto;
export var { createDecipher } = crypto;
export var { createDecipheriv } = crypto;
export var { createDiffieHellman } = crypto;
export var { createDiffieHellmanGroup } = crypto;
export var { createECDH } = crypto;
export var { createHash } = crypto;
export var { createHmac } = crypto;
export var { createSign } = crypto;
export var { createVerify } = crypto;
export var { getCiphers } = crypto;
export var { getDiffieHellman } = crypto;
export var { getHashes } = crypto;
export var { listCiphers } = crypto;
export var { pbkdf2 } = crypto;
export var { pbkdf2Sync } = crypto;
export var { privateDecrypt } = crypto;
export var { privateEncrypt } = crypto;
export var { prng } = crypto;
export var { pseudoRandomBytes } = crypto;
export var { publicDecrypt } = crypto;
export var { publicEncrypt } = crypto;
export var { randomBytes } = crypto;
export var { randomFill } = crypto;
export var { randomFillSync } = crypto;
export var { rng } = crypto;
export var { webcrypto } = crypto;

export var getRandomValues = function (abv) {
  let l = abv.length;
  while (l--) {
    const bytes = randomBytes(7);
    let randomFloat = (bytes[0] % 32) / 32;

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      randomFloat = (randomFloat + byte) / 256;
    }

    abv[l] = Math.floor(randomFloat * 256);
  }
  return abv;
};

export var randomUUID = function () {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function (c) {
    return (
      c ^
      (getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16);
  });
};
