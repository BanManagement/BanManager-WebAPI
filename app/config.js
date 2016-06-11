var configs = require('../config')
  , env = process.env.NODE_ENV || 'development'

if (configs[env] === undefined) {
  throw new Error('No config for environment \'' + env + '\'')
}

var config = configs[env]

config.env = env

if (env !== 'development' && env !== 'test' && config.secretKey === 'YouMustChangeThis') {
  throw new Error('You must change the default secretKey')
}

module.exports = config
