const { unparse } = require('uuid-parse')

module.exports = async function server(obj, { id }, { state: { serversPool } }) {
  if (!serversPool.has(id)) throw new Error('Server not found')

  const server = Object.assign({}, serversPool.get(id).config)

  server.console = { id: unparse(server.console) }

  const now = Math.floor(Date.now() / 1000)
  const [ [ { mysqlTime } ] ] = await server.execute(`SELECT (${now} - UNIX_TIMESTAMP()) AS mysqlTime`)
  const offset = mysqlTime > 0 ? Math.floor(mysqlTime) : Math.ceil(mysqlTime)

  server.timeOffset = offset * 1000

  return server
}
