module.exports = function () {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/me'
      , handler: function (req, reply) {
          reply({ data: { id: req.auth.credentials.player_id, type: 'user' } })
        }
      , config:
        { auth: 'jwt'
        }
      })

    cb()
  }
}
