const { randomBytes, createCipher } = require('crypto')
const { difference } = require('lodash')
const { parse } = require('uuid-parse')
const { createConnection } = require('mysql2/promise')
const tables = require('../../../data/tables')
const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createServer(obj, { input }, { state }) {
  const id = randomBytes(4).toString('hex') // @TODO Use async randomBytes
  const diff = difference(Object.keys(input.tables), tables)

  if (diff.length) throw new ExposedError(`Tables differ: ${diff.join(', ')}`)

  const conn = await createConnection(input)

  const tablesMissing = await Promise.reduce(tables, async (missing, table) => {
    const [ [ { exists } ] ] = await conn.execute(
      'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
      , [ input.database, input.tables[table] ])

    if (!exists) missing.push(table)

    return missing
  }, [])

  if (tablesMissing.length) {
    conn.end()
    throw new ExposedError(`Tables do not exist in the database: ${tablesMissing.join(', ')}`)
  }

  const [ [ exists ] ] = await conn.query(
    'SELECT id FROM ?? WHERE id = ?'
    , [ input.tables.players, parse(input.console, new Buffer(16)) ])

  conn.end()

  if (!exists) {
    throw new ExposedError(`Console UUID not found in ${input.tables.players} table`)
  }

  if (input.password) {
    const cipher = createCipher(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_KEY)
    let encrypted = cipher.update(input.password, 'utf8', 'hex')

    encrypted += cipher.final('hex')

    input.password = encrypted
  } else {
    input.password = ''
  }

  // Clean up
  input.console = parse(input.console, new Buffer(16))
  input.tables = JSON.stringify(input.tables)

  await udify.insert(state.dbPool, 'bm_web_servers', { ...input, id })

  return { id }
}
