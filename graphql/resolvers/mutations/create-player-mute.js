const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createPlayerMute(obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerMutes
  const player = parse(input.player, new Buffer(16))
  const actor = session.playerId
  let id

  try {
    const [ result ] = await server.query(
      `INSERT INTO ${table}
        (player_id, actor_id, reason, created, updated, expires, soft)
          VALUES
        (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), ?)`
      , [ player, actor, input.reason, input.expires, input.soft ])

    id = result.id
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ExposedError('Player already muted on selected server, please unmute first')
    }
  }

  const data = await state.loaders.playerMute.serverDataId.load({ server: input.server, id })

  return data
}
