var Hapi = require('hapi')
  , hapiPm2 = require('hapi-graceful-pm2')
  , hapiBunyan = require('hapi-bunyan')
  , hapiBoom = require('hapi-boom-decorators')
  , hapiAuthJWT = require('hapi-auth-jwt2')
  , Japi = require('japi')

// Use bluebird instead of native
global.Promise = require('bluebird')

module.exports = function app(AuthenticationStrategy, config, logger, cb) {
  var server = new Hapi.Server()

  server.connection(
    { port: process.env.PORT || config.port
    , routes:
      { cors:
        { origin: config.webClients
        }
      , validate:
        { failAction: function (req, reply, source, error) {
            // Override 400 to 422 for Ember Data
            error.output.statusCode = 422

            return Japi.failAction(req, reply, source, error)
          }
        }
      }
    })

  server.register(
    [ { register: hapiPm2
      , options: { timeout: 30000 }
      }
    , { register: hapiBunyan
      , options: { logger: logger }
      }
    , { register: hapiBoom
      }
    ])

  server.register(hapiAuthJWT)
  server.auth.strategy('jwt', 'jwt', false, AuthenticationStrategy)

  cb(null, server)
}
