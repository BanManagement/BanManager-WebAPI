module.exports = function (ServerModel) {
  function register(server, options, next) {
    server.ext('onPreHandler', function (req, reply) {
      if (req.route.path.indexOf('{serverId}') === -1) return reply.continue()

      ServerModel
        .forge({ id: req.params.serverId })
        .fetch()
        .then(function (model) {
          if (!model) return reply.notFound()
          req.app.server = model

          return reply.continue()
        }).catch(reply)
    })

    next()
  }

  register.attributes = { name: 'serverLookup' }

  return { register: register }
}
