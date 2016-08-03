module.exports = function (player, actor) {
  return {
    'player_id': player.id
  , 'actor_id': actor.id
  , reason: 'Test'
  , created: Math.floor(Date.now() / 1000)
  , updated: Math.floor(Date.now() / 1000)
  , expires: 0
  }
}
