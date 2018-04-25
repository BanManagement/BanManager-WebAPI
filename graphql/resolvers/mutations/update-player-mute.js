const udify = require('../../../data/udify')

module.exports = async function updatePlayerMute(obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)
  const table = server.config.tables.playerMutes

  await udify.update(server, table, { soft: input.soft ? 1 : 0, expires: input.expires, reason: input.reason }, { id })

  const data = await state.loaders.playerMute.serverDataId.load({ server: serverId, id })

  return data
}
