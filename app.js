var Hapi = require('hapi')
  , hapiPm2 = require('hapi-graceful-pm2')
  , hapiBunyan = require('hapi-bunyan')

module.exports = function app(config, logger, cb) {
  var server = new Hapi.Server()

  server.connection({ port: process.env.PORT || config.port })

  server.register(
    [ { register: hapiPm2
      , options: { timeout: 30000 }
      }
    , { register: hapiBunyan
      , options: { logger: logger }
      }
    ])

  cb(null, server)
}
