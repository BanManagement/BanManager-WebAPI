const { difference } = require('lodash')
const setupPool = require('./setup-db-pool')
const { createDecipher } = require('crypto')

async function interval(servers, dbPool, logger) {
  const [ rows ] = await dbPool.query('SELECT * FROM bm_web_servers')
  const newIds = rows.map((server) => {
    server.tables = JSON.parse(server.tables)

    if (servers.has(server.id)) {
      // Check for modifications
      const currentServer = servers.get(server.id)
      const diff = JSON.stringify(currentServer.config) !== JSON.stringify(server) // @TODO Use isEqual, but currently causes infinite loop

      if (!diff) return server.id

      // @TODO Only modify pool if connection details have changed
      currentServer.pool.end().catch((error) => logger.error(error, 'servers-pool'))
    }

    let password

    if (server.password) {
      const decipher = createDecipher(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_KEY)
      let decrypted = decipher.update(server.password, 'hex', 'utf8')

      decrypted += decipher.final('utf8')

      password = decrypted
    }

    const poolConfig =
      { connectionLimit: 5
      , host: server.host
      , port: server.port
      , user: server.user
      , password: password
      , database: server.database
      }
    const pool = setupPool(poolConfig, logger)
    const serverDetails =
      { config: server
      , pool
      , execute: pool.execute.bind(pool)
      , query: pool.query.bind(pool)
      }

    logger.debug({ id: server.id }, 'Loaded server')

    servers.set(server.id, serverDetails)

    return server.id
  })

  if (!newIds.length) return

  const leftOvers = difference(Array.from(servers.keys), newIds)

  leftOvers.forEach((server) => {
    logger.debug({ id: server.id }, 'Removed server')
    servers.remove(server.id).pool.end().catch((error) => logger.error(error, 'servers-pool'))
  })

  return servers
}

module.exports = async (dbPool, logger, disableInterval) => {
  const servers = new Map()

  // Run now
  await interval(servers, dbPool, logger)

  // @TODO Inefficient, message bus/pub sub? Or alternatively, create server pool connections per request when needed?
  if (!disableInterval) setInterval(interval, 3000, servers, dbPool, logger)

  return servers
}
