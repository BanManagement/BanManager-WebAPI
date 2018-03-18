const udify = require('../../../data/udify')

module.exports = async function updatePlayerNote(obj, { id, serverId, input }, { state }) {
  let data = await state.loaders.playerNote.serverDataId.load({ server: serverId, id })
  console.log(data)
  throw new Error('ASD')
  const server = state.serversPool.get(serverId)
  const table = server.config.tables.playerNotes

  await udify.update(server, table, { message: input.message }, { id })

  data = await state.loaders.playerNote.serverDataId.load({ server: serverId, id })

  return data[0] // @TODO Investigate, shouldn't .load return one item?
}
