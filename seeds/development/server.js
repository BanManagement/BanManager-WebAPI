var crypto = require('crypto')
  , uuid = require('uuid')

exports.seed = function (knex, Promise) {
  return Promise.join(
      knex('bm_web_servers').del()

    // Inserts
    , knex('bm_web_servers').insert(
      { id: crypto.randomBytes(6).toString('hex')
      , name: 'Development'
      , host: '127.0.0.1'
      , database: 'bm_dev'
      , user: 'root'
      , console: uuid.parse('e4c3f489-3bdf-43b9-b1ab-f43ae6d2050e', new Buffer(16))
      , tables: JSON.stringify(
        { players: 'bm_players'
        , playerBans: 'bm_player_bans'
        , playerBanRecords: 'bm_player_ban_records'
        , playerMutes: 'bm_player_mutes'
        , playerMuteRecords: 'bm_player_mute_records'
        , playerKicks: 'bm_player_kicks'
        , playerNotes: 'bm_player_notes'
        , playerHistory: 'bm_player_history'
        , playerPins: 'bm_player_pins'
        , playerReports: 'bm_player_reports'
        , playerReportCommands: 'bm_player_report_commands'
        , playerReportComments: 'bm_player_report_comments'
        , playerReportLocations: 'bm_player_report_locations'
        , playerReportStates: 'bm_player_report_states'
        , playerReportLogs: 'bm_report_logs'
        , serverLogs: 'bm_server_logs'
        , playerWarnings: 'bm_player_warnings'
        , ipBans: 'bm_ip_bans'
        , ipBanRecords: 'bm_ip_ban_records'
        , ipMutes: 'bm_ip_mutes'
        , ipMuteRecords: 'bm_ip_mute_records'
        , ipRangeBans: 'bm_ip_range_bans'
        , ipRangeBanRecords: 'bm_ip_range_ban_records'
        })
      })
  )
}
