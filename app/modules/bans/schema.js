var Joi = require('joi')
  , schema =
      Joi.object(
        { data:
          { attributes:
            { 'player_id': Joi.string().guid().required()
            , reason: Joi.string().min(1).required()
            , created: Joi.date().timestamp('unix').raw().required()
            , updated: Joi.date().timestamp('unix').raw().required()
            , expires: Joi.number().min(0).required()
            }
          , relationships:
            { server:
              { data:
                { id: Joi.string().min(1).required()
                }
              }
            , actor:
              { data:
                { id: Joi.string().guid().required()
                }
              }
            }
          }
        })

module.exports = schema.options({ abortEarly: false, stripUnknown: true })
