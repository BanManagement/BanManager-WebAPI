var Joi = require('joi')
  , tablesSchema = function () {
      var tables =
        [ 'players'
        , 'playerAppeals'
        , 'playerBans'
        , 'playerBanRecords'
        , 'playerMutes'
        , 'playerMuteRecords'
        , 'playerKicks'
        , 'playerNotes'
        , 'playerHistory'
        , 'playerPins'
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
  , schema = function () {
      return Joi.object(
        { data:
          { attributes:
            { name: Joi.string().min(1).required()
            , host: Joi.string().hostname().required()
            , database: Joi.string().min(1).required()
            , user: Joi.string().token().required()
            , password: Joi.string().allow('')
            , console: Joi.string().guid().required()
            , tables: tablesSchema().required()
            }
          }
        })
    }

module.exports.create = schema(true).options({ abortEarly: false, stripUnknown: true })
module.exports.update = schema().options({ abortEarly: false, stripUnknown: true })
