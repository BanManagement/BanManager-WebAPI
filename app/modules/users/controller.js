module.exports = function () {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/me'
      , handler: function (req, reply) {
          // TODO Added ACL attributes
          var attributes =
            { name: req.auth.credentials.name
            }

          reply({ data: { id: req.auth.credentials.player_id, type: 'user', attributes: attributes } })
        }
      , config:
        { auth: 'jwt'
        }
      })

    cb()
  }
}
