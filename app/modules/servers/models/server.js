var crypto = require('crypto')
  , uuid = require('uuid')
  , config = require('app/config')
  , createDb = Promise.promisify(require('app/modules/db'))
  , algorithm = 'aes-256-ctr' // @TODO confirm this is strong enough

module.exports = function ServerModel(db, cb) {
  var model = db.Model.extend(
    { tableName: 'bm_web_servers'
    , hasTimestamps: false
    // @TODO
    // , hidden: [ 'host', 'user', 'password', 'database', 'console', 'tables' ]
    , initialize: function () {
        this.on('saving', this._generateId)
        // @TODO Revisit for cluster/scaling support
        this.on('saved', this.dbConnect)
        this.on('fetched', this.dbConnect)
        this.on('destroyed', this.dbConnectDestroy)
      }
    , _generateId: function (model) {
        if (model.isNew()) {
          model.set(model.idAttribute, crypto.randomBytes(4).toString('hex'))
        }
      }
    , dbConnect: function (model) {
        if (model.db) model.db.knex.destroy()

        var config =
          { client: 'mysql2'
          , connection: model.attributes
          , pool:
            { min: 0
            , max: 3
            }
          }

        return createDb(config)
          .then(function (db) {
            model.db = db
          })
          .catch(function (error) {
            throw error
          })
      }
    , dbConnectDestroy: function (model) {
        return model.db.knex
          .destroy()
          .then(function () {
            delete model.db
          })
      }
    , format: function (attributes) {
        if (attributes.password) {
          var cipher = crypto.createCipher(algorithm, config.secretKey)
            , encrypted = cipher.update(attributes.password, 'utf8', 'hex')

          encrypted += cipher.final('hex')

          attributes.password = encrypted
        }

        if (attributes.tables) attributes.tables = JSON.stringify(attributes.tables)
        if (attributes.console) attributes.console = uuid.parse(attributes.console, new Buffer(16))

        return attributes
      }
    , parse: function (attributes) {
        if (attributes.password) {
          var decipher = crypto.createDecipher(algorithm, config.secretKey)
            , decrypted = decipher.update(attributes.password, 'hex', 'utf8')

          decrypted += decipher.final('utf8')

          attributes.password = decrypted
        }

        // @TODO try/catch
        if (attributes.tables) attributes.tables = JSON.parse(attributes.tables)
        if (attributes.console) attributes.console = uuid.unparse(attributes.console)

        return attributes
      }
    })

  cb(null, model)
}
