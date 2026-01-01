// crypto-polyfill.js
const { webcrypto } = require('crypto');

// Make crypto available globally
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// Also ensure randomUUID is available
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto.randomUUID = function() {
    return webcrypto.randomUUID();
  };
}

console.log('Crypto polyfill loaded');