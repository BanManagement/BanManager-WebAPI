var uuid = require('uuid')
  , crypto = require('crypto')
  , ip = require('ip')

module.exports = function (insert) {
  var player =
  { id: uuid.v4()
  , name: crypto.randomBytes(6).toString('hex')
  , ip: '127.0.0.1'
  , lastSeen: Math.floor(Date.now() / 1000)
  }

  if (insert) {
    player.id = uuid.parse(player.id, new Buffer(16))
    player.ip = ip.toLong(player.ip)
  }

  return player
}
