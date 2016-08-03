var crypto = require('crypto')

module.exports = function () {
  return {
    name: crypto.randomBytes(6).toString('hex')
  , host: '127.0.0.1'
  , database: 'bm_web_test'
  , user: 'root'
  , console: 'AEBA57B2D1384AD88969B73617C868CF'
  , tables:
    { players: 'bm_players'
    , playerBans: 'bm_player_bans'
    , playerBanRecords: 'bm_player_ban_records'
    , playerMutes: 'bm_player_mutes'
    , playerMuteRecords: 'bm_player_mute_records'
    , playerKicks: 'bm_player_kicks'
    , playerNotes: 'bm_player_notes'
    , playerHistory: 'bm_player_history'
    , playerReports: 'bm_player_reports'
    , playerReportLocations: 'bm_player_report_locations'
    , playerReportStates: 'bm_player_report_states'
    , playerReportCommands: 'bm_player_report_commands'
    , playerReportComments: 'bm_player_report_comments'
    , playerWarnings: 'bm_player_warnings'
    , ipBans: 'bm_ip_bans'
    , ipBanRecords: 'bm_ip_ban_records'
    , ipMutes: 'bm_ip_mutes'
    , ipMuteRecords: 'bm_ip_mute_records'
    , ipRangeBans: 'bm_ip_range_bans'
    , ipRangeBanRecords: 'bm_ip_range_ban_records'
    }
  }
}
