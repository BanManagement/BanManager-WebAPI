var Boom = require('boom')
  , Joi = require('joi')
  , tablesSchema = function () {
      var tables =
        [ 'players'
        , 'playerBans'
        , 'playerBanRecords'
        , 'playerMutes'
        , 'playerMuteRecords'
        , 'playerKicks'
        , 'playerNotes'
        , 'playerHistory'
        , 'playerReports'
        , 'playerReportLocations'
        , 'playerReportStates'
        , 'playerReportCommands'
        , 'playerReportComments'
        , 'playerWarnings'
        , 'ipBans'
        , 'ipBanRecords'
        , 'ipMutes'
        , 'ipMuteRecords'
        , 'ipRangeBans'
        , 'ipRangeBanRecords'
        ]
        , schema = {}

      tables.forEach(function (table) {
        schema[table] = Joi.string().min(1).required()
      })

      return Joi.object(schema)
    }
  , serverSchema = Joi.object(
    { name: Joi.string().min(1).required()
    , host: Joi.string().hostname().required()
    , database: Joi.string().min(1).required()
    , user: Joi.string().token().required()
    , password: Joi.string()
    , console: Joi.string().guid().required()
    , tables: tablesSchema()
    }).options({ abortEarly: false })

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
            }).catch(function (error) {
              reply(error)
            })
        }
      , config:
        { validate:
          { payload: serverSchema
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
            }).catch(function (error) {
              reply(error)
            })
        }
      })

    // server.post('/', function (req, res, next) {
    //   // Create a server
    // })

    // server.patch('/', function (req, res, next) {
    //   // Update a server
    // })

    // server.delete('/', function (req, res, next) {
    //   // Delete a server
    // })
    cb()
  }
}
