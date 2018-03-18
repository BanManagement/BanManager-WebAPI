const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const udify = require('../../../data/udify')

module.exports = async function assignReport(obj, { serverId, player, report: id }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const table = server.config.tables.playerReports
  let report = await state.loaders.report.serverDataId.load({ server: serverId, id })

  if (!report) throw new ExposedError(`Report ${id} does not exist`)

  await udify.update(server, table,
    { updated: 'UNIX_TIMESTAMP()', 'state_id': 2, 'assignee_id': parse(player, new Buffer(16)) }, { id })

  report = await state.loaders.report.serverDataId.load({ server: serverId, id })

  return report
}
