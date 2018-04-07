const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createPlayerBan(obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerBans
  const player = parse(input.player, new Buffer(16))
  const actor = session.playerId
  let id

  try {
    const [ result ] = await server.query(
      `INSERT INTO ${table}
        (player_id, actor_id, reason, created, updated, expires)
          VALUES
        (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), ?)`
      , [ player, actor, input.reason, input.expires ])

    id = result.id
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ExposedError('Player already banned on selected server, please unban first')
    }
  }

  const data = await state.loaders.playerBan.serverDataId.load({ server: input.server, id })

  return data
}
