const enums =
{ PlayerBan: 'playerBans'
, PlayerKick: 'playerKicks'
, PlayerMute: 'playerMutes'
, PlayerNote: 'playerNotes'
, PlayerWarning: 'playerWarnings'
}

module.exports = (type) => enums[type]
