var schema = require('../bans/schema')
  , JSONAPIDeserializer = require('jsonapi-serializer').Deserializer
  , deserialise = new JSONAPIDeserializer(
    { keyForAttribute: function (key) { return key }
    })

module.exports = function (dataMapper, WarningModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          deserialise.deserialize(req.payload)
            .then(function (data) {
              data['actor_id'] = req.payload.data.relationships.actor.data.id

              return WarningModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (warning) {
              warning.set('id', req.app.server.get('id') + '-' + warning.attributes.id)

              reply(dataMapper(warning, 'player-warning'))
            })
            .catch(reply)
        }
      , config:
        { auth: 'jwt'
        , validate:
          { payload: schema
          }
        }
      })

    server.route(
      { method: 'PATCH'
      , path: '/{serverId}-{warningId}'
      , handler: function (req, reply) {
          var p = WarningModel(req.app.server)
            .forge({ id: req.params.warningId })
            .fetch()
            .then(function (warning) {
              if (!warning) {
                reply.notFound()
                return p.cancel()
              }

              return deserialise.deserialize(req.payload)
            })
            .then(function (data) {
              data.id = req.params.warningId
              data['actor_id'] = req.payload.data.relationships.actor.data.id

              return WarningModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (warning) {
              warning.set('id', req.app.server.get('id') + '-' + req.params.warningId)

              reply(dataMapper(warning, 'player-warning'))
            })
            .catch(reply)
        }
      , config:
        { auth: 'jwt'
        , validate:
          { payload: schema
          }
        }
      })

    server.route(
      { method: 'DELETE'
      , path: '/{serverId}-{warningId}'
      , handler: function (req, reply) {
          WarningModel(req.app.server)
            .forge({ id: req.params.warningId })
            .fetch()
            .then(function (warning) {
              if (!warning) return reply.notFound()

              return warning.destroy({ require: true })
            })
            .then(function () {
              reply().code(204)
            })
            .catch(reply)
        }
      , config:
        { auth: 'jwt' }
      })

    server.route(
      { method: 'GET'
      , path: '/{serverId}-{warningId}'
      , handler: function (req, reply) {
          WarningModel(req.app.server)
            .forge({ id: req.params.warningId })
            .fetch()
            .then(function (warning) {
              if (!warning) return reply.notFound()

              return reply(dataMapper(warning, 'player-warning'))
            })
            .catch(reply)
        }
      })

    cb()
  }
}
