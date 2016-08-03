var crypto = require('crypto')
  , uuid = require('uuid')
  , fixture = require('../fixtures/server')

exports.seed = function (knex, Promise) {
  var server = fixture()

  server.id = crypto.randomBytes(4).toString('hex')
  server.tables = JSON.stringify(server.tables)
  server.console = uuid.parse(server.console, new Buffer(16))

  return Promise.join(
    knex('bm_web_servers').insert(server)
  )
}
