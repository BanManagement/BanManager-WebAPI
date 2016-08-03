var jwt = require('jsonwebtoken')
  , xxhash = require('xxhash')
  , Joi = require('joi')
  , bcrypt = require('bcrypt')
  , hashCompare = Promise.promisify(bcrypt.compare)

module.exports = function (config, PinModel, PlayerModel, ServerCollection, SessionModel, UserModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'POST'
      , path: '/login'
      , handler: function (req, reply) {
          var p

          if (req.payload.type === 'password') {
            p = UserModel
              .forge({ email: req.payload.email })
              .fetch()
              .then(function (user) {
                if (!user) reply.notFound()

                return hashCompare(req.payload.password, user.get('password'))
                  .then(function (matches) {
                    if (!matches) return reply.notFound()

                    return Promise.resolve(user)
                  })
              })
          } else if (req.payload.type === 'pin') {
            var server = ServerCollection.get(req.payload.server)
              , data

            if (!server) return reply.notFound()

            p = PlayerModel(server)
              .forge({ name: req.payload.username })
              .fetch()
              .then(function (player) {
                if (!player) return reply.notFound()

                data = player

                // @TODO Expires check
                return PinModel(server)
                  .forge({ 'player_id': player.id, pin: req.payload.pin })
                  .fetch()
              })
              .then(function (pin) {
                if (!pin) return reply.notFound()

                return pin.destroy().then(function () { return data })
              })
          }

          p
            .then(function (matches) {
              if (!matches) return

              var id = new SessionModel().generateId()
                , playerId = matches.get('id') || matches.get('player_id')
                , expires = Math.floor(Date.now() / 1000) + 14400 // 4 hours
                , tokenData =
                  { id: id.toString('hex')
                  , 'player_id': playerId
                  , name: matches.attributes.name || matches.attributes.display_name
                  , exp: expires
                  }
                , token = jwt.sign(tokenData, config.secretKey)
                , tokenHash = xxhash.hash(new Buffer(token), config.fastHashSeed, 'buffer')

              req.log.debug(tokenData, 'auth token data')

              return SessionModel.forge(
                { id: id
                , 'player_id': playerId
                , 'token_hash': tokenHash
                , created: Math.floor(Date.now() / 1000)
                , expires: expires
                })
                .save({}, { method: 'insert' })
                .then(function () {
                  reply({ token: token })
                })
            })
            .catch(reply)
        }
      , config:
        { validate:
          { payload: Joi.alternatives().try(
              Joi.object(
                { email: Joi.string().email().required()
                , password: Joi.string().min(1).required()
                , type: Joi.string().valid('password').required()
                })
            , Joi.object(
                { username: Joi.string().regex(/^[a-zA-Z0-9-_]{2,16}$/).required()
                , pin: Joi.number().min(100000).max(999999).required()
                , server: Joi.string().min(4).required()
                , type: Joi.string().valid('pin').required()
                })
            )
          }
        }
      })

    cb()
  }
}
