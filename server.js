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
