var Joi = require('joi')
  , tablesSchema = function (create) {
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
        schema[table] = Joi.string().min(1)

        if (create) schema[table] = schema[table].required()
      })

      return Joi.object(schema)
    }
  , schema = function (create) {
    if (create) {
      return Joi.object(
        { name: Joi.string().min(1).required()
        , host: Joi.string().hostname().required()
        , database: Joi.string().min(1).required()
        , user: Joi.string().token().required()
        , password: Joi.string()
        , console: Joi.string().guid().required()
        , tables: tablesSchema(true).required()
        })
    } else {
      return Joi.object(
        { name: Joi.string().min(1)
        , host: Joi.string().hostname()
        , database: Joi.string().min(1)
        , user: Joi.string().token()
        , password: Joi.string()
        , console: Joi.string().guid()
        , tables: tablesSchema()
        })
    }
  }

module.exports.create = schema(true).options({ abortEarly: false, stripUnknown: true })
module.exports.update = schema().options({ abortEarly: false, stripUnknown: true })
