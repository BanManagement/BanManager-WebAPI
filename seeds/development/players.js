var uuid = require('uuid')
  , ip = require('ip').toLong('127.0.0.1')
  , uuids =
    [ 'ae51c849-3f2a-4a37-986d-55ed5b02307f'
    , 'b55249d4-9226-4c11-9877-d757c3fe180f'
    , '1e963f6e-f570-426e-8f0e-8510b3d13ef4'
    , 'e4c3f489-3bdf-43b9-b1ab-f43ae6d2050d'
    , 'e4c3f489-3bdf-43b9-b1ab-f43ae6d2050e'
    ]

exports.seed = function (knex, Promise) {
  var now = Math.floor(Date.now() / 1000)

  uuids = uuids.map(function (id) {
    return uuid.parse(id, new Buffer(16))
  })

  return Promise.join(
    // Deletes ALL existing entries
    knex('bm_players').del(),

    // Inserts seed entries
    knex('bm_players').insert({ id: uuids[0], name: 'confuser', ip: ip, lastSeen: now }),
    knex('bm_players').insert({ id: uuids[1], name: 'JamsJar', ip: ip, lastSeen: now }),
    knex('bm_players').insert({ id: uuids[2], name: 'SavannahF', ip: ip, lastSeen: now }),
    knex('bm_players').insert({ id: uuids[3], name: '04stewe1', ip: ip, lastSeen: now }),
    knex('bm_players').insert({ id: uuids[4], name: 'Console', ip: ip, lastSeen: now })
  )
}
