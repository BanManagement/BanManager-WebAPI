var uuid = require('uuid')

exports.seed = function (knex, Promise) {
  var pins = []

  for (var i = 0; i <= 9999; i++) {
    pins.push(
      { 'player_id': uuid.parse('ae51c849-3f2a-4a37-986d-55ed5b02307f', new Buffer(16))
      , pin: 123456
      , expires: 0
      })
  }

  return Promise.join(knex('bm_player_pins').del(), knex('bm_player_pins').insert(pins))
}
