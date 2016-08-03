var schema = require('../bans/schema')
  , JSONAPIDeserializer = require('jsonapi-serializer').Deserializer
  , deserialise = new JSONAPIDeserializer(
    { keyForAttribute: function (key) { return key }
    })

module.exports = function (dataMapper, MuteModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          var p = MuteModel(req.app.server)
            .forge({ 'player_id': req.payload.data.attributes.player_id })
            .fetch()
            .then(function (mute) {
              if (mute) {
                reply.badData('Player already muted')
                return p.cancel()
              }

              return deserialise.deserialize(req.payload)
            })
            .then(function (data) {
              data['actor_id'] = req.payload.data.relationships.actor.data.id

              return MuteModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (mute) {
              mute.set('id', req.app.server.get('id') + '-' + mute.attributes.id)

              reply(dataMapper(mute, 'player-mute'))
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
      , path: '/{serverId}-{muteId}'
      , handler: function (req, reply) {
          var p = MuteModel(req.app.server)
            .forge({ id: req.params.muteId })
            .fetch()
            .then(function (mute) {
              if (!mute) {
                reply.notFound()
                return p.cancel()
              }

              return deserialise.deserialize(req.payload)
            })
            .then(function (data) {
              data.id = req.params.muteId
              data['actor_id'] = req.payload.data.relationships.actor.data.id

              return MuteModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (mute) {
              mute.set('id', req.app.server.get('id') + '-' + req.params.muteId)

              reply(dataMapper(mute, 'player-mute'))
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
      , path: '/{serverId}-{muteId}'
      , handler: function (req, reply) {
          MuteModel(req.app.server)
            .forge({ id: req.params.muteId })
            .fetch()
            .then(function (mute) {
              if (!mute) return reply.notFound()

              return mute.destroy({ require: true })
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
      , path: '/{serverId}-{muteId}'
      , handler: function (req, reply) {
          MuteModel(req.app.server)
            .forge({ id: req.params.muteId })
            .fetch()
            .then(function (mute) {
              if (!mute) return reply.notFound()

              return reply(dataMapper(mute, 'player-mute'))
            })
            .catch(reply)
        }
      })

    cb()
  }
}
