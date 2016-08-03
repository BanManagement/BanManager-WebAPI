var _ = require('lodash')

module.exports = function (ServerCollection) {
  function register(server, options, next) {
    server.ext('onPreHandler', function (req, reply) {
      if (req.route.path.indexOf('{serverId}') === -1 && !_.get(req.payload, 'data.relationships.server.data.id')) {
        return reply.continue()
      }

      var model = ServerCollection.get(req.params.serverId || req.payload.data.relationships.server.data.id)

      if (!model) return reply.notFound()

      req.app.server = model

      return reply.continue()
    })

    next()
  }

  register.attributes = { name: 'serverLookup' }

  return { register: register }
}
