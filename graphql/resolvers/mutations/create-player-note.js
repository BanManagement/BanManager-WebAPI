const { parse } = require('uuid-parse')

module.exports = async function createPlayerNote(obj, { input }, { state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerNotes
  const player = parse(input.player, new Buffer(16))
  const actor = state.session.playerId

  const [ { id } ] = await server.query(
    'INSERT INTO ?? (player_id, actor_id, message, created) VALUES(?, ?, ?, UNIX_TIMESTAMP())'
    , [ table, player, actor, input.message ])
  const data = await state.loaders.playerNote.serverDataId.load({ server: input.server, id })

  return data
}
