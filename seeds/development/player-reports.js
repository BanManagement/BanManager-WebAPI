var uuid = require('uuid')
  , uuids =
    [ 'ae51c849-3f2a-4a37-986d-55ed5b02307f'
    , 'b55249d4-9226-4c11-9877-d757c3fe180f'
    , '1e963f6e-f570-426e-8f0e-8510b3d13ef4'
    ]

exports.seed = function (knex, Promise) {
  var now = Math.floor(Date.now() / 1000)

  uuids = uuids.map(function (id) {
    return uuid.parse(id, new Buffer(16))
  })

  return Promise.join(
      knex('bm_player_report_commands').del()
    , knex('bm_player_report_comments').del()
    , knex('bm_player_report_locations').del()
    , knex('bm_player_report_states').del()
    , knex('bm_player_reports').del()
    , knex('bm_report_logs').del()
    , knex('bm_server_logs').del()

    // Inserts
    , knex('bm_player_report_states').insert(
      { id: 1
      , name: 'Open'
      })
    , knex('bm_player_report_states').insert(
      { id: 2
      , name: 'Assigned'
      })
    , knex('bm_player_report_states').insert(
      { id: 3
      , name: 'Resolved'
      })
    , knex('bm_player_report_states').insert(
      { id: 4
      , name: 'Closed'
      })
    , knex('bm_player_report_commands').insert(
      { id: 1
      , 'report_id': 1
      , 'actor_id': uuids[2]
      , command: 'ban'
      , args: 'confuser Hacking'
      , created: now
      , updated: now
      })
    , knex('bm_player_report_comments').insert(
      { 'report_id': 1
      , 'actor_id': uuids[2]
      , comment: 'Resolved'
      , created: now
      , updated: now
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 1
      , 'player_id': uuids[0]
      , world: 'world'
      , x: 0
      , y: 60
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 1
      , 'player_id': uuids[1]
      , world: 'world'
      , x: 0
      , y: 30
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_reports').insert(
      { id: 1
      , 'player_id': uuids[0]
      , reason: 'Hacking'
      , 'actor_id': uuids[1]
      , 'assignee_id': uuids[2]
      , 'state_id': 3
      , created: now
      , updated: now
      })
    , knex('bm_server_logs').insert(
      { id: 1
      , message: 'confuser moved too fast'
      , created: now
      })
    , knex('bm_server_logs').insert(
      { id: 2
      , message: 'NCP fail check for confuser'
      , created: now
      })
    , knex('bm_report_logs').insert(
      { id: 1
      , 'log_id': 1
      , 'report_id': 1
      })
    , knex('bm_report_logs').insert(
      { id: 2
      , 'log_id': 2
      , 'report_id': 1
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 2
      , 'player_id': uuids[0]
      , world: 'world'
      , x: 0
      , y: 60
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 2
      , 'player_id': uuids[1]
      , world: 'world'
      , x: 0
      , y: 30
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_reports').insert(
      { id: 2
      , 'player_id': uuids[0]
      , reason: 'Greifing'
      , 'actor_id': uuids[1]
      , 'state_id': 1
      , created: now
      , updated: now
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 3
      , 'player_id': uuids[0]
      , world: 'world'
      , x: 0
      , y: 60
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_reports').insert(
      { id: 3
      , 'player_id': uuids[0]
      , reason: 'Swearing'
      , 'actor_id': uuids[1]
      , 'assignee_id': uuids[2]
      , 'state_id': 2
      , created: now
      , updated: now
      })
    , knex('bm_player_report_locations').insert(
      { 'report_id': 4
      , 'player_id': uuids[0]
      , world: 'world'
      , x: 0
      , y: 60
      , z: 0
      , pitch: 0
      , yaw: 0
      })
    , knex('bm_player_reports').insert(
      { id: 4
      , 'player_id': uuids[0]
      , reason: 'Hackin'
      , 'actor_id': uuids[1]
      , 'assignee_id': uuids[2]
      , 'state_id': 4
      , created: now
      , updated: now
      })
  )
}
