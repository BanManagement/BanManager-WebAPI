const { parse } = require('uuid-parse')

module.exports = async function createPlayerWarning(obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerWarnings
  const player = parse(input.player, new Buffer(16))
  const actor = session.playerId
  const [ { id } ] = await server.query(
    `INSERT INTO ${table}
      (player_id, actor_id, reason, created, expires, points, read)
        VALUES
      (?, ?, ?, UNIX_TIMESTAMP(), ?, ?, ?)`
    , [ player, actor, input.reason, input.expires, input.points, 0 ])

  const data = await state.loaders.playerWarning.serverDataId.load({ server: input.server, id })

  return data[0] // @TODO Investigate, shouldn't .load return one item?
}
