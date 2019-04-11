global.Promise = require('bluebird')
require('dotenv').config()
const requireEnv = require('require-environment-variables')

requireEnv(
  [ 'LOG_LEVEL',
    'PORT',
    'ENCRYPTION_KEY',
    'ENCRYPTION_ALGORITHM',
    'SESSION_KEY',
    'SESSION_NAME',
    'SESSION_DOMAIN',
    'SITE_HOST',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_NAME',
    'DB_CONNECTION_LIMIT'
  ])

const logger = require('pino')(
  { name: 'banmanager-api',
    level: process.env.LOG_LEVEL
  })
const createApp = require('./app')
const setupPool = require('./data/connections/setup-db-pool')
const setupServersPool = require('./data/connections/servers-pool')
const port = process.env.PORT
const dbConfig =
{ connectionLimit: process.env.DB_CONNECTION_LIMIT,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: false
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
