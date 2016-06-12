var _ = require('lodash')
  , schema = require('./schema')
  , validateConnection = require('app/lib/validate-connection')

module.exports = function (ServerModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          validateConnection(req.payload, req.payload.tables, function (error) {
            if (error) return reply.badRequest(error.message)

            ServerModel
              .forge(req.payload)
              .save()
              .then(function (server) {
                reply(server.toJSON())
              })
              .catch(reply)
          })
        }
      , config:
        { validate:
          { payload: schema.create
          }
        }
      })

    server.route(
      { method: 'GET'
      , path: '/'
      , handler: function (req, reply) {
          ServerModel.fetchAll().then(function (servers) {
            reply(servers.toJSON())
          }).catch(function (error) {
            reply(error)
          })
        }
      })

    server.route(
      { method: 'GET'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          reply(req.app.server.toJSON())
        }
      })

    server.route(
      { method: 'PATCH'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          if (!Object.keys(req.payload).length) return reply.badRequest('Missing payload')

          var merged = _.merge({}, req.app.server.toJSON(), req.payload)

          validateConnection(merged, merged.tables, function (error) {
            if (error) return reply.badRequest(error.message)

            req.app.server.save(req.payload, { patch: true })
              .then(function (updatedServer) {
              // updatedServer is sometimes boom error, huh?
              if (updatedServer && !updatedServer.isBoom) reply(updatedServer.toJSON())
            })
            .catch(reply)
          })
        }
      , config:
        { validate:
          { payload: schema.update
          }
        }
      })

    server.route(
      { method: 'DELETE'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          req.app.server.destroy()
            .then(function () {
              reply(req.app.server.toJSON())
            }).catch(reply)
        }
      })

    cb()
  }
}
