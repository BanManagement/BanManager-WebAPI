const { hash } = require('../data/hash')

module.exports = async function ({ request: { body: { email, password } }, response, session, state }) {
  if (!session || !session.playerId) {
    response.body = { error: 'You are not logged in' }
    return
  }

  const [ [ checkResult ] ] = await state.dbPool.execute(
    'SELECT email FROM bm_web_users WHERE player_id = ?', [ session.playerId ])

    if (checkResult) {
    response.body = { error: 'You already have an account' }
    return
  }

  const [ [ emailResult ] ] = await state.dbPool.execute(
    'SELECT email FROM bm_web_users WHERE email = ?', [ email ])

  if (emailResult) {
    response.body = { error: 'You already have an account' }
    return
  }

  if (!email || typeof email !== 'string') { // @TODO Validate email address
    response.body = { error: 'Invalid email address' }
    return
  }

  if (!password || typeof password !== 'string') {
    response.body = { error: 'Invalid password' }
    return
  }

  const encodedHash = await hash(password)
  const conn = await state.dbPool.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'INSERT INTO bm_web_users (player_id, email, password) VALUES(?, ?, ?)', [ session.playerId, email, encodedHash ])

    await conn.execute(
      'INSERT INTO bm_web_player_roles (player_id, role_id) VALUES(?, ?)', [ session.playerId, 2 ])

    await conn.commit()
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      conn.rollback()
    }
  } finally {
    conn.release()
  }

  response.body = null
}
