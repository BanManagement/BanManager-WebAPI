var Joi = require('joi')
  , bcrypt = require('bcrypt')
  , hash = Promise.promisify(bcrypt.hash)

module.exports = function (dataMapper, UserModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/me'
      , handler: function (req, reply) {
          UserModel
            .forge({ 'player_id': req.auth.credentials.player_id })
            .fetch()
            .then(function (user) {
              // TODO Added ACL attributes
              var attributes =
                { name: req.auth.credentials.name
                , registered: !!user
                }

              reply({ data: { id: req.auth.credentials.player_id, type: 'user', attributes: attributes } })
            })
        }
      , config:
        { auth: 'jwt'
        }
      })

    server.route(
      { method: 'PUT'
      , path: '/me'
      , handler: function (req, reply) {
          var user
            , method = 'update'

          , p = UserModel
            .forge({ 'player_id': req.auth.credentials.player_id })
            .fetch()
            .then(function (data) {
              user = data

              if (!user) {
                if (!req.payload.password) {
                  reply.badRequest('Missing password')
                  return p.cancel()
                }

                if (!req.payload.email) {
                  reply.badRequest('Missing email')
                  return p.cancel()
                }

                user = UserModel.forge({ 'player_id': req.auth.credentials.player_id })
                method = 'insert'
              }

              if (!req.payload.name) user.set('display_name', req.auth.credentials.name)
              if (req.payload.email) user.set('email', req.payload.email)
              if (req.payload.password) return hash(req.payload.password, 10)
            })
            .then(function (password) {
              if (password) user.set('password', password)

              var opts = { method: method }

              if (method === 'update') opts.patch = true

              return user.save(null, opts)
            })
            .then(function (user) {
              reply(dataMapper(user, 'user'))
            })
            .catch(reply)
        }
      , config:
        { auth: 'jwt'
        , validate:
          { payload:
            { email: Joi.string().email()
            , password: Joi.string().min(4).max(60)
            }
          }
        }
      })

    cb()
  }
}
