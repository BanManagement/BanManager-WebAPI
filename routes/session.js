const { verify } = require('../data/hash')

module.exports = async function (ctx) {
  if (ctx.request.body.password) return handlePasswordLogin(ctx)

  return handlePinLogin(ctx)
}

async function handlePasswordLogin({ session, response, throw: throwError, request: { body: { email, password } }, state }) {
  const [ [ result ] ] = await state.dbPool.execute('SELECT player_id AS playerId, password FROM bm_web_users WHERE email = ?', [ email ])

  if (!result) return throwError(400, 'Incorrect login details')

  const match = await verify(result.password, password)

  if (!match) return throwError(400, 'Incorrect login details')

  session.playerId = result.playerId

  response.body = null
}

async function handlePinLogin({ session, response, throw: throwError, request: { body: { name, pin, server: serverId } }, state }) {
  const server = state.serversPool.get(serverId)

  if (typeof pin !== 'string') return throwError(400, 'Invalid pin type')
  if (!server) return throwError(400, 'Server does not exist')

  const table = server.config.tables.playerPins
  const [ [ result ] ] = await server.execute(`
    SELECT
      pins.id AS id, p.id AS playerId, pins.pin AS pin
    FROM
      bm_players p
          RIGHT JOIN
      bm_player_pins pins ON pins.player_id = p.id
    WHERE
      p.name = ?
    LIMIT 1`, [ name ])

  if (!result) return throwError(400, 'Incorrect login details')

  const match = await verify(result.pin, pin)

  if (!match) return throwError(400, 'Incorrect login details')

  await server.execute(`DELETE FROM ${table} WHERE id = ?`, [ result.id ])

  session.playerId = result.playerId

  const [ [ checkResult ] ] = await state.dbPool.execute('SELECT email FROM bm_web_users WHERE player_id = ?', [ result.playerId ])

  response.body = { hasAccount: !!checkResult }
}
