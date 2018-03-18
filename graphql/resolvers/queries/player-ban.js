module.exports = async function playerBan(obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerBan.serverDataId.load({ server: server, id })

  return data[0] // @TODO Investigate, shouldn't .load return one item?
}
