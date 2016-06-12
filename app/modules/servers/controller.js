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
      , path: '/{id}'
      , handler: function (req, reply) {
          ServerModel
            .forge({ id: req.params.id })
            .fetch()
            .then(function (server) {
              if (!server) return reply.notFound()

              reply(server.toJSON())
            })
            .catch(reply)
        }
      })

    server.route(
      { method: 'PATCH'
      , path: '/{id}'
      , handler: function (req, reply) {
          ServerModel
            .forge({ id: req.params.id })
            .fetch()
            .then(function (server) {
              if (!server) return reply.notFound()
              if (!Object.keys(req.payload).length) return reply.badRequest('Missing payload')

              var merged = _.merge({}, server.toJSON(), req.payload)

              validateConnection(merged, merged.tables, function (error) {
                if (error) return reply.badRequest(error.message)

                server.save(req.payload, { patch: true })
                  .then(function (updatedServer) {
                  // updatedServer is sometimes boom error, huh?
                  if (updatedServer && !updatedServer.isBoom) reply(updatedServer.toJSON())
                })
                .catch(reply)
              })
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
      , path: '/{id}'
      , handler: function (req, reply) {
          ServerModel
            .forge({ id: req.params.id })
            .fetch()
            .then(function (server) {
              if (!server) return reply.notFound()

              return server.destroy().then(function () {
                reply(server.toJSON())
              })
            })
            .catch(reply)
        }
      })

    cb()
  }
}
