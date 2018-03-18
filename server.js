global.Promise = require('bluebird')
require('dotenv').config()

const logger = require('pino')(
  { name: 'banmanager-api'
  , level: process.env.LOG_LEVEL
})
const createApp = require('./app')
const setupPool = require('./data/connections/setup-db-pool')
const setupServersPool = require('./data/connections/servers-pool')
const port = process.env.PORT
const dbConfig =
{ connectionLimit: process.env.DB_CONNECTION_LIMIT
, host: process.env.DB_HOST
, port: process.env.DB_PORT
, user: process.env.DB_USER
, password: process.env.DB_PASSWORD
, database: process.env.DB_NAME
, multipleStatements: false
}

;(async () => {
  try {
    const dbPool = await setupPool(dbConfig)
    const serversPool = await setupServersPool(dbPool, logger)
    const app = await createApp(dbPool, logger, serversPool)

    app.listen(port)

    logger.info(`Listening on ${port}`)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
})()
