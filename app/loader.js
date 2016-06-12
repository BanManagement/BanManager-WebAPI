var async = require('async')
  , controllers = require('../controllers')
  , plugins = require('../plugins')

module.exports = function (modules, callback) {
  var app = modules.app

  if (!app) return callback(new Error('Missing app module'))

  var pm = modules.pluginManager
    , controllerCount = 0

  async.eachSeries(plugins, function (file, callback) {
    var plugin = pm.bond(require(file))()

    app.register(plugin, callback)
  }
  , function (error) {
    if (error) return callback(error)

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
    }
    , function (error) {
      callback(error, app)
    })
  })
}
