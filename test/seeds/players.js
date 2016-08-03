var playerFixture = require('../fixtures/player')

exports.seed = function (knex, Promise) {
  return Promise.join(
    // Inserts seed entries
    knex('bm_players').insert(playerFixture(true))
  , knex('bm_players').insert(playerFixture(true))
  )
}
