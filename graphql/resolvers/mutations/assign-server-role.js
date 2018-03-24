const { parse } = require('uuid-parse')
const { remove } = require('lodash')
const ExposedError = require('../../../data/exposed-error')
const udify = require('../../../data/udify')

module.exports = async function assignServerRole(obj, { players, role: id, serverId }, { state }) {
  if (!state.serversPool.get(serverId)) throw new ExposedError(`Server ${serverId} does not exist`)

  const role = await state.loaders.role.ids.load(id)

  if (!role) throw new ExposedError(`Role ${id} does not exist`)

  // @TODO Should we validate players exist?
  const playerIds = players.map(id => parse(id, new Buffer(16)))

  // Check if players are alraedy in this role, and if so, ignore, making this mutation idempotent
  const [ results ] = await state.dbPool.query(`SELECT player_id FROM bm_web_player_server_roles WHERE
    server_id = ? AND role_id = ? AND player_id IN (?)`, [ serverId, id, playerIds ])

  if (results.length) {
    remove(playerIds, results.map(row => row.player_id))
  }

  if (!playerIds.length) return role

  const rows = playerIds.map(id => ({ player_id: id, role_id: id }))

  await udify.insert(state.dbPool, 'bm_web_player_server_roles', rows)

  return role
}
