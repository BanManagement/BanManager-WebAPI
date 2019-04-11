module.exports = function servers (obj, {}, { state }) {
  return Array.from(state.serversPool.values()).map(server => server.config)
}
