var uuid = require('uuid')

module.exports = function parseUUID(cb) {
  cb(null, function (str) {
    return uuid.parse(str, new Buffer(16))
  })
}
