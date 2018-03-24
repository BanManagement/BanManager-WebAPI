const enums =
{ PlayerBan: 'player.bans'
, PlayerKick: 'player.kicks'
, PlayerMute: 'player.mutes'
, PlayerNote: 'player.notes'
, PlayerWarning: 'player.warnings'
}

module.exports = (type) => enums[type]
