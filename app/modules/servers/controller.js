var _ = require('lodash')
  , schema = require('./schema')
  , validateConnection = require('app/lib/validate-connection')

module.exports = function (dataMapper, ServerCollection) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          validateConnection(req.payload, req.payload.tables, function (error) {
            if (error) return reply.badRequest(error.message)

            ServerCollection
              .create(req.payload.data.attributes)
              .then(function (server) {
                reply(dataMapper(server, 'server'))
              })
              .catch(reply)
          })
        }
      , config:
        { validate:
          { payload: schema.create
          }
        , auth: 'jwt'
        }
      })

    server.route(
      { method: 'GET'
      , path: '/'
      , handler: function (req, reply) {
          reply(dataMapper(ServerCollection, 'server'))
        }
      })

    server.route(
      { method: 'GET'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          return reply(dataMapper(req.app.server, 'server'))

          reply(dataMapper(req.app.server.toJSON(!!req.auth.credentials), 'server'))
        }
      , config: { auth: 'jwt' }
      })

    server.route(
      { method: 'GET'
      , path: '/{serverId}/time'
      , handler: function (req, reply) {
          var builder = req.app.server.db.knex

          builder
            .select(
              builder.raw('(' + Math.floor(Date.now() / 1000) + ' - UNIX_TIMESTAMP(now())) AS mysqlTime')
            )
            .then(function (results) {
              var offset = results[0].mysqlTime

              offset = offset > 0 ? Math.floor(offset) : Math.ceil(offset)
              offset = offset * 1000

              reply({ offset: offset })
            })
            .catch(reply)
        }
      })

    server.route(
      { method: 'PATCH'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          var data = req.payload.data.attributes

          validateConnection(data, data.tables, function (error) {
            if (error) return reply.badRequest(error.message)

            req.app.server.save(data, { patch: true })
              .then(function (updatedServer) {
              // updatedServer is sometimes boom error, huh?
              if (updatedServer && !updatedServer.isBoom) reply(dataMapper(updatedServer, 'server'))
            })
            .catch(reply)
          })
        }
      , config:
        { validate:
          { payload: schema.update
          }
        , auth: 'jwt'
        }
      })

    server.route(
      { method: 'DELETE'
      , path: '/{serverId}'
      , handler: function (req, reply) {
          req.app.server.destroy({ required: true })
            .then(function () {
              reply().code(204)
            }).catch(reply)
        }
      , config: { auth: 'jwt' }
      })

    cb()
  }
}
