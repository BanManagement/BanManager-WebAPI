var Boom = require('boom')
  , schema = require('./schema')

module.exports = function (ServerModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          ServerModel
            .forge(req.payload)
            .save()
            .then(function (server) {
              reply(server.toJSON())
            })
            .catch(reply)
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
              if (!server) return reply(Boom.notFound())

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
              if (!server) return reply(Boom.notFound())
              if (!Object.keys(req.payload).length) return reply(Boom.badRequest('Missing payload'))

              return server.save(req.payload, { patch: true })
            })
            .then(function (updatedServer) {
              // updatedServer is sometimes boom error, huh?
              if (!updatedServer.isBoom) reply(updatedServer.toJSON())
            })
            .catch(reply)
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
              if (!server) return reply(Boom.notFound())

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
