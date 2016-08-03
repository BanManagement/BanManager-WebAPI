process.env.NODE_ENV = 'test' // @TODO Move out of code

var noOpLogger = require('mc-logger')
  , pluginable = require('pluginable')
  , configuration = require('app/config')
  , pm = pluginable(require('../modules'))
  , loader = require('app/loader')
  , dbCleaner = require('knex-cleaner')
  , cachedApp

noOpLogger.child = function () { return noOpLogger }

module.exports = function (done) {
  if (cachedApp) return done(null, cachedApp)

  if (process.env.LOG_LEVEL) {
    pm.registerBeforeLoad(function logger(cb) { cb(null, require('app/logger')(configuration)) })
  } else {
    pm.registerBeforeLoad(function logger(cb) { cb(null, noOpLogger) })
  }

  pm.registerBeforeLoad(function config(cb) { cb(null, configuration) })
  pm.registerBeforeLoad(function pluginManager(cb) { cb(null, pm) })

  pm.load(function (error, modules) {
    if (error) return done(error)

    loader(modules, function (error, app) {
      if (error) return done(error)

      cachedApp = app

      // Setup database
      var db = modules.db.knex

      dbCleaner.clean(db, { ignoreTables: [ 'bm_web_migrations', 'bm_web_migrations_lock' ] }).then(function () {
        return db.migrate.latest()
      })
      .then(function () {
        return db.seed.run()
      })
      .then(function () {
        done(null, app)
      }).catch(function (error) {
        throw error
      })
    })
  })
}
