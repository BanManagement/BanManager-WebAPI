const { unparse } = require('uuid-parse')
const { uniqBy } = require('lodash')

module.exports = async function searchPlayers (obj, { name, limit }, { state }) {
  name = name + '%'

  const results = await Promise.map(state.serversPool.values(), async (server) => {
    const table = server.config.tables.players
    const [rows] = await server.execute(`SELECT * FROM ${table} WHERE name LIKE ? LIMIT ?`, [name, limit])

    return rows
  })
    .reduce((prev, cur) => prev.concat(cur))

  return uniqBy(results.map((player) => {
    player.id = unparse(player.id)

    return player
  }), 'id')
}
