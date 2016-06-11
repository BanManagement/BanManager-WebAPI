var pluginable = require('pluginable')
  , async = require('async')
  , configuration = require('app/config')
  , bunyanLogger = require('app/logger')(configuration)
  , pm = pluginable(require('./modules'))
  , controllers = require('./controllers')
  , moduleCount = 0
  , controllerCount = 0

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

  var app = modules.app

  if (!app) {
    modules.logger.error(new Error('Missing app module'))
    process.exit(1)
  }

  modules.logger.info(moduleCount + ' modules loaded')

  // Find controllers
  async.forEachOf(controllers, function (file, path, callback) {
    var router = pm.bond(require(file))()

    if (!router) return callback(new Error(path + ' missing returned router'))

    router.attributes = { name: path }

    app.register(
      { register: router
      }
      , { routes: { prefix: path } }
      , function (error) {
        if (error) return callback(error)

        modules.logger.info('Loaded ' + path)
        controllerCount++

        callback()
      })
  }, function (error) {
    if (error) {
      modules.logger.error(error)
      process.exit(1)
    }

    modules.logger.info(controllerCount + ' controllers loaded')

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
