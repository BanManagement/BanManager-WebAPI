process.env.NODE_ENV = 'test' // @TODO Move out of code

var noOpLogger = require('mc-logger')
  , pluginable = require('pluginable')
  , async = require('async')
  , configuration = require('app/config')
  , pm = pluginable(require('../modules'))
  , controllers = require('../controllers')
  , cachedApp

noOpLogger.child = function () { return noOpLogger }

module.exports = function (done) {
  if (cachedApp) return done(null, cachedApp)

  pm.registerBeforeLoad(function logger(cb) { cb(null, noOpLogger) })
  pm.registerBeforeLoad(function config(cb) { cb(null, configuration) })
  pm.registerBeforeLoad(function pluginManager(cb) { cb(null, pm) })

  pm.load(function (error, modules) {
    if (error) return done(error)

    var app = modules.app

    if (!app) return done(new Error('Missing app module'))

    // Find controllers
    async.forEachOf(controllers, function (file, path, callback) {
      var router = pm.bond(require(file))()

      if (!router) return callback(new Error(path + ' missing returned router'))

      router.attributes = { name: path }

      app.register(
        { register: router
        }
        , { routes: { prefix: path } }
        , callback)
    }, function (error) {
      if (error) return done(error)

      cachedApp = app

      // Setup database
      var db = modules.db.knex
      // db.seed.run() when eventually needed

      db.migrate.latest().then(function () {
        done(null, app)
      }).catch(function (error) {
        throw error
      })
    })
  })
}
