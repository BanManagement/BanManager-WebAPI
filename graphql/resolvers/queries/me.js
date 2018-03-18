const ExposedError = require('../../../data/exposed-error')

module.exports = async function me(obj, info, { session, state }) {
  if (!session || !session.playerId) throw new ExposedError('Invalid session')

  return state.loaders.player.ids.load(session.playerId)
}
