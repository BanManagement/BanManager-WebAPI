module.exports = function (PlayerModel) {
  function register(server, options, next) {
    server.ext('onPreHandler', function (req, reply) {
      if (!req.payload || !req.payload.actor_id) return reply.continue()

      var id = req.payload.actor_id

      PlayerModel(req.app.server)
        .forge({ id: id })
        .fetch()
        .then(function (model) {
          if (!model) return reply.notFound('Actor not found')
          req.app.actor = model

          return reply.continue()
        }).catch(reply)
    })

    next()
  }

  register.attributes = { name: 'actorLookup' }

  return { register: register }
}
