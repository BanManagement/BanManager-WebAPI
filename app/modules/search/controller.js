var uuid = require('uuid')
  , Joi = require('joi')
  , _ = require('lodash')

module.exports = function (ServerCollection, PlayerModel, BanModel, MuteModel
  , BanRecordModel, MuteRecordModel, WarningModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/'
      , handler: function (req, reply) {
          var promises = []
            , name = req.query['filter[name]']

          ServerCollection
            .forEach(function (model) {
              var tables = model.get('tables')
                , query = model.db.knex
                .select(
                    model.db.knex.raw('\'' + model.get('id') + '\' AS server')
                  , 'p.id AS id'
                  , 'name'
                  , 'b.id AS banId'
                  , 'b.reason AS banReason'
                  , 'b.expires AS banExpires'
                  , 'm.id AS muteId'
                  , 'm.reason AS muteReason'
                  , 'm.expires AS muteExpires'
                  , model.db.knex
                      .raw('(SELECT COUNT(player_id) FROM ?? WHERE player_id = p.id) AS bans', tables.playerBanRecords)
                  , model.db.knex
                    .raw('(SELECT COUNT(player_id) FROM ?? WHERE player_id = p.id) AS mutes', tables.playerMuteRecords)
                  )
                .from(tables.players + ' AS p')
                .leftJoin(tables.playerBans + ' AS b', 'b.player_id', 'p.id')
                .leftJoin(tables.playerMutes + ' AS m', 'm.player_id', 'p.id')
                .offset(req.query.offset)
                .limit(req.query.limit)

                var total = model.db.knex.from(tables.players).count('name AS total')

                if (name) {
                  query.where('p.name', 'LIKE', name + '%')
                  total.where('name', 'LIKE', name + '%')
                }

              req.log.debug(query.toString(), 'search query')

              promises.push(query, total)
            })

          Promise.all(promises)
            .spread(function (results, resultTotal) {
              if (!results) return reply({ data: [], meta: { total: 0 } })

              var total = resultTotal[0].total
                , data = results.map(function (result) {
                    var data =
                      { id: uuid.unparse(result.id)
                      , type: 'player'
                      , attributes:
                        { server: result.server
                        , name: result.name
                        , bans: { total: result.bans }
                        , mutes: { total: result.mutes }
                        }
                      , relationships: {}
                      , included: []
                      }

                    if (result.banId) {
                      data.relationships.bans =
                        { data: [{ type: 'player-ban', id: result.banId + '-' + result.server }] }

                      var ban =
                        { type: 'ban'
                        , id: result.banId + '-' + result.server
                        , attributes: { reason: result.banReason, expires: result.banExpires }
                        }

                      data.included.push(ban)
                    }

                    if (result.muteId) {
                      data.relationships.mutes =
                        { data: [{ type: 'player-mute', id: result.muteId + '-' + result.server }] }

                      var mute =
                        { type: 'mute'
                        , id: result.muteId + '-' + result.server
                        , attributes: { reason: result.muteReason, expires: result.muteExpires }
                        }

                      data.included.push(mute)
                    }

                    return data
                  })

              reply({ data: data, meta: { total: total } })
            }).catch(reply)
        }
      , config:
        { validate:
          { query:
            { 'filter[name]': Joi.string().regex(/^[a-zA-Z0-9-_]{2,16}$/)
            , limit: Joi.number().integer().min(1).max(100).default(25)
            , offset: Joi.number().integer().min(0).default(0)
            }
          }
        }
      })

    server.route(
      { method: 'GET'
      , path: '/{id}'
      , handler: function (req, reply) {
          var parsedId = uuid.parse(req.params.id, new Buffer(16))
            , id = uuid.unparse(parsedId)

          if (req.params.id !== id) return reply.notFound()

          var player =
              { data:
                { id: id
                , type: 'player'
                , attributes: {}
                , relationships:
                  { servers: { data: [] }
                  }
                }
              , included: []
              }

          Promise.all(ServerCollection.map(function (model) {
            return Promise.resolve(model)
          }))
          .each(function (server) {
            player.data.relationships.servers.data.push({ id: server.get('id'), type: 'server' })

            return PlayerModel(server)
              .forge({ id: id })
              .fetch()
              .then(function (playerData) {
                if (!playerData) return
                if (!player.data.attributes.lastSeen ||
                  player.data.attributes.lastSeen < playerData.attributes.lastSeen) {

                  player.data.attributes.name = playerData.attributes.name
                  player.data.attributes.lastSeen = playerData.attributes.lastSeen
                }

                if (!playerData.attributes.name) return

                var promises =
                  { 'player-ban': BanModel(server).where({ 'player_id': parsedId }).fetchAll()
                  , 'player-mute': MuteModel(server).where({ 'player_id': parsedId }).fetchAll()
                  , 'player-warning': WarningModel(server).where({ 'player_id': parsedId }).fetchAll()
                  , 'player-ban-record': BanRecordModel(server).where({ 'player_id': parsedId }).fetchAll()
                  , 'player-mute-record': MuteRecordModel(server).where({ 'player_id': parsedId }).fetchAll()
                  }

                return Promise.props(promises)
              })
              .then(function (results) {
                if (!results) return

                var relationships = player.data.relationships

                Object.keys(results).forEach(function (type) {
                  var plural = type.replace(/player-/, '') + 's'
                    , data = results[type].toJSON()

                  if (!relationships[plural]) relationships[plural] = {}
                  if (!relationships[plural].data) relationships[plural] = { data: [] }

                  // @TODO merge into one map
                  relationships[plural].data = relationships[plural].data.concat(
                    data.map(function (item) {
                        return { id: item.server + '-' + item.id, type: type }
                      }))

                  var records = data.map(function (item) {
                    item['player_id'] = id

                    var record = {
                      id: item.server + '-' + item.id
                    , type: type
                    , attributes: _.omit(item, [ 'id', 'actor_id', 'pastActor_id' ])
                    , relationships:
                      { server:
                        { data: { id: item.server, type: 'server' }
                        }
                      , actor:
                        { data: { id: uuid.unparse(item.actor_id), type: 'player' }
                        }
                      }
                    }

                    if (item.pastActor) {
                      record.relationships.pastActor = { data: { id: uuid.unparse(item.pastActor_id), type: 'player' } }
                    }

                    return record
                  })

                  player.included = player.included.concat(records)
                })
              })
          })
          .then(function () {
            if (!player.data.attributes.name) return reply.notFound()

            reply(player)
          })
          .catch(reply)
        }
      , config:
        { validate:
          { params:
            { id: Joi.string().guid().required()
            }
          }
        }
      })

    cb()
  }
}
