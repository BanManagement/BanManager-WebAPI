var uuid = require('uuid')
  , uuids =
    [ 'ae51c849-3f2a-4a37-986d-55ed5b02307f'
    , 'b55249d4-9226-4c11-9877-d757c3fe180f'
    , '1e963f6e-f570-426e-8f0e-8510b3d13ef4'
    , 'e4c3f489-3bdf-43b9-b1ab-f43ae6d2050e'
    ]

exports.seed = function (knex, Promise) {
  var now = Math.floor(Date.now() / 1000)

  uuids = uuids.map(function (id) {
    return uuid.parse(id, new Buffer(16))
  })

  return Promise.join(
      knex('bm_player_warnings').del()

    // Inserts
    , knex('bm_player_warnings').insert(
      { id: 1
      , 'player_id': uuids[0]
      , reason: 'Testing in dev'
      , 'actor_id': uuids[3]
      , created: now
      , expires: 0
      })
    , knex('bm_player_warnings').insert(
      { id: 2
      , 'player_id': uuids[1]
      , reason: 'Testing in dev'
      , 'actor_id': uuids[3]
      , created: now
      , expires: now + 31536000 // 1 year
      })
    , knex('bm_player_warnings').insert(
      { id: 3
      , 'player_id': uuids[2]
      , reason: 'Testing in dev'
      , 'actor_id': uuids[3]
      , created: now
      , expires: 0
      })
  )
}
