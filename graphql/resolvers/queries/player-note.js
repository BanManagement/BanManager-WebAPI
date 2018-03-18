module.exports = async function playerNote(obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerNote.serverDataId.load({ server: server, id })

  return data[0] // @TODO Investigate, shouldn't .load return one item?
}
