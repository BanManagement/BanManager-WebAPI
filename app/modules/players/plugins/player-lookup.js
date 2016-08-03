module.exports = function (PlayerModel) {
  function register(server, options, next) {
    server.ext('onPreHandler', function (req, reply) {
      if (req.route.path.indexOf('{playerId}') === -1 && (!req.payload || !req.payload.player_id)) {
        return reply.continue()
      }

      var id = req.params.playerId || req.payload.player_id

      PlayerModel(req.app.server)
        .forge({ id: id })
        .fetch()
        .then(function (model) {
          if (!model) return reply.notFound('Player not found')
          req.app.player = model

          return reply.continue()
        }).catch(reply)
    })

    next()
  }

  register.attributes = { name: 'playerLookup' }

  return { register: register }
}
