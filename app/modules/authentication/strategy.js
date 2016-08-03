var xxhash = require('xxhash')
  , extractToken = require('hapi-auth-jwt2/lib/extract')
  , extractOpts = { cookieKey: false, urlKey: false }

module.exports = function AuthenticationStrategy(config, SessionModel, cb) {
  var seed = config.fastHashSeed
    , strategy =
      { key: config.secretKey
      , validateFunc: function (decoded, req, cb) {
          if (!decoded.id || !decoded.player_id) return cb(null, false)

          var token = extractToken(req, extractOpts)
            , tokenHash = xxhash.hash(new Buffer(token), seed, 'buffer')

          req.log.debug(decoded, 'auth validate')

          // TODO check expires
          SessionModel
            .forge({ id: new Buffer(decoded.id, 'hex'), 'token_hash': tokenHash })
            .fetch()
            .then(function (session) {
              console.log(session)
              return cb(null, !!session)
            })
            .catch(cb)
        }
      , verifyOptions: { algorithms: [ 'HS256' ] }
      }

  cb(null, strategy)
}
