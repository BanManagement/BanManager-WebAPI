var uuid = require('uuid')
  , schema = require('./schema')
  , JSONAPIDeserializer = require('jsonapi-serializer').Deserializer
  , deserialise = new JSONAPIDeserializer(
    { keyForAttribute: function (key) { return key }
    })

module.exports = function (dataMapper, parseUUID, BanModel, BanRecordModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/'
      , handler: function (req, reply) {
          var playerId = parseUUID(req.payload.data.attributes.player_id)
            , p = PlayerAppealModel(req.app.server)
            .forge({ 'actor_id': playerId, 'type_id': req.payload.data.attributes.type_id })
            .fetch()
            .then(function (ban) {
              if (ban) {
                reply.badData('Player already banned')
                return p.cancel()
              }

              return deserialise.deserialize(req.payload)
            })
            .then(function (data) {
              // We should use format/parse, but relation lookups fail
              data['actor_id'] = parseUUID(req.payload.data.relationships.actor.data.id)
              data['player_id'] = playerId

              return BanModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (ban) {
              ban.set('id', req.app.server.get('id') + '-' + ban.attributes.id)

              reply(dataMapper(ban, 'player-ban'))
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
      , path: '/{serverId}-{banId}'
      , handler: function (req, reply) {
          var p = BanModel(req.app.server)
            .forge({ id: req.params.banId })
            .fetch()
            .then(function (ban) {
              if (!ban) {
                reply.notFound()
                return p.cancel()
              }

              return deserialise.deserialize(req.payload)
            })
            .then(function (data) {
              data.id = req.params.banId
              data['actor_id'] = parseUUID(req.payload.data.relationships.actor.data.id)
              data['player_id'] = parseUUID(req.payload.data.attributes.player_id)

              return BanModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (ban) {
              ban.set('id', req.app.server.get('id') + '-' + req.params.banId)

              reply(dataMapper(ban, 'player-ban'))
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
      , path: '/{serverId}-{banId}'
      , handler: function (req, reply) {
          var punishment

          BanModel(req.app.server)
            .forge({ id: req.params.banId })
            .fetch()
            .then(function (ban) {
              if (!ban) return reply.notFound()

              punishment = ban.attributes

              return ban.destroy({ require: true })
            })
            .then(function () {
              var data =
              { 'player_id': punishment.player_id
              , reason: punishment.reason
              , expired: punishment.expires
              , 'actor_id': punishment.actor_id
              , 'pastActor_id': punishment.actor_id
              , pastCreated: punishment.created
              , created: Math.floor(Date.now() / 1000)
              , createdReason: req.query.reason || ''
              }

              return BanRecordModel(req.app.server)
                .forge(data)
                .save()
            })
            .then(function (record) {
              reply().code(204)
            })
            .catch(reply)
        }
      , config:
        { auth: 'jwt' }
      })

    server.route(
      { method: 'GET'
      , path: '/{serverId}-{banId}'
      , handler: function (req, reply) {
          BanModel(req.app.server)
            .forge({ id: req.params.banId })
            .fetch()
            .then(function (ban) {
              if (!ban) return reply.notFound()

              ban.set('id', req.app.server.get('id') + '-' + req.params.banId)

              var data = dataMapper(ban, 'player-ban')

              // @TODO See if there's a way to reduce this
              // dataMapper currently removes *_id attributes
              data.data.attributes['player_id'] = uuid.unparse(ban.get('player_id'))

              // Attach the server
              data.data.relationships =
              { server:
                { data:
                  { type: 'server'
                  , id: req.params.serverId
                  }
                }
              , actor:
                { data:
                  { type: 'player'
                  , id: uuid.unparse(ban.get('actor_id'))
                  }

                }
              }

              return reply(data)
            })
            .catch(reply)
        }
      })

    cb()
  }
}
