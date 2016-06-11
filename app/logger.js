module.exports = function logger(config) {
  var bunyanLogger = require('bunyan').createLogger(
    { name: 'site'
    , stream: process.stdout
    , level: config.logLevel || process.env.LOG_LEVEL || 'debug'
    })

  return bunyanLogger
}
