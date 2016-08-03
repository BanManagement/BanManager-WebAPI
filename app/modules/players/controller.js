var schema = require('./schema')

module.exports = function () {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/server/{serverId}/player/{playerId}'
      , handler: function (req, reply) {
          reply(req.app.player.toJSON())
        }
      , config:
        { validate:
          { payload: schema.create
          }
        }
      })

    // server.route(
    //   { method: 'GET'
    //   , path: '/'
    //   , handler: function (req, reply) {
    //       reply(ServerCollection.toJSON())
    //     }
    //   })

    // server.route(
    //   { method: 'GET'
    //   , path: '/{serverId}'
    //   , handler: function (req, reply) {
    //       reply(req.app.server.toJSON())
    //     }
    //   })

    // server.route(
    //   { method: 'PATCH'
    //   , path: '/{serverId}'
    //   , handler: function (req, reply) {
    //       if (!Object.keys(req.payload).length) return reply.badRequest('Missing payload')

    //       var merged = _.merge({}, req.app.server.toJSON(), req.payload)

    //       validateConnection(merged, merged.tables, function (error) {
    //         if (error) return reply.badRequest(error.message)

    //         req.app.server.save(req.payload, { patch: true })
    //           .then(function (updatedServer) {
    //           // updatedServer is sometimes boom error, huh?
    //           if (updatedServer && !updatedServer.isBoom) reply(updatedServer.toJSON())
    //         })
    //         .catch(reply)
    //       })
    //     }
    //   , config:
    //     { validate:
    //       { payload: schema.update
    //       }
    //     }
    //   })

    // server.route(
    //   { method: 'DELETE'
    //   , path: '/{serverId}'
    //   , handler: function (req, reply) {
    //       req.app.server.destroy()
    //         .then(function () {
    //           reply(req.app.server.toJSON())
    //         }).catch(reply)
    //     }
    //   })

    cb()
  }
}
