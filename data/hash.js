const crypto = require('crypto')
const Promise = require('bluebird')
const randomBytes = Promise.promisify(crypto.randomBytes)
const argon2 = require('argon2-ffi').argon2i

module.exports = {
  async hash (str) {
    return argon2.hash(str, await randomBytes(32))
  },
  async verify (hash, str) {
    return argon2.verify(hash, str)
  }
}
