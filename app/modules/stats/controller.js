var router = require('app/router')()
  , view = require('./view')

module.exports = function (pluginManager) {
  router.get('/', pluginManager.bond(view)())

  return router
}
