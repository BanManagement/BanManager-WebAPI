const udify = require('../../../data/udify')

module.exports = async function updatePlayerBan(obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)
  const table = server.config.tables.playerBans

  await udify.update(server, table, { expires: input.expires, reason: input.reason }, { id })

  const data = await state.loaders.playerBan.serverDataId.load({ server: serverId, id })

  return data[0] // @TODO Investigate, shouldn't .load return one item?
}
