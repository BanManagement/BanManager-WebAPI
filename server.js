<<<<<<< HEAD
var pluginable = require('pluginable')
  , configuration = require('app/config')
  , bunyanLogger = require('app/logger')(configuration)
  , loader = require('app/loader')
  , pm = pluginable(require('./modules'))
  , moduleCount = 0

pm.on('afterLoad', function (module) {
  bunyanLogger.info(module.name, 'module loaded')
  moduleCount++
})

pm.registerBeforeLoad(function logger(cb) { cb(null, bunyanLogger) })
pm.registerBeforeLoad(function config(cb) { cb(null, configuration) })
pm.registerBeforeLoad(function pluginManager(cb) { cb(null, pm) })

pm.load(function (error, modules) {
  if (error) {
    bunyanLogger.error(error)
    process.exit(1)
  }

  loader(modules, function (error, app) {
    if (error) {
      bunyanLogger.error(error)
      process.exit(1)
    }

    modules.logger.info(moduleCount + ' modules loaded')

    app.start(function (error) {
      if (error) {
        modules.logger.error(error)
        process.exit(1)
      }

      require('blocked')(function (ms) {
        modules.logger.warn('blocked', { ms: ms })
      })

      modules.logger.info('Server running at:', app.info.uri)
    })
  })
})
=======
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
>>>>>>> 386a8b5... Rewrite using GraphQL
