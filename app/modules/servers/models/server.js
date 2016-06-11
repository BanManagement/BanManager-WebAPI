var crypto = require('crypto')
  , config = require('app/config')
  , uuid = require('uuid')
  , algorithm = 'aes-256-ctr' // @TODO confirm this is strong enough

module.exports = function ServerModel(db, cb) {
  var model = db.Model.extend(
    { tableName: 'bm_web_servers'
    , hasTimestamps: false
    , hidden: [ 'host', 'user', 'password', 'database', 'console', 'tables' ]
    , initialize: function () {
        this.on('saving', this._generateId)
      }
    , _generateId: function (model) {
        if (model.isNew()) {
          model.set(model.idAttribute, crypto.randomBytes(4).toString('hex'))
        }
      }
    , format: function (attributes) {
        if (attributes.password) {
          var cipher = crypto.createCipher(algorithm, config.secretKey)
            , encrypted = cipher.update(attributes.password, 'utf8', 'hex')

          encrypted += cipher.final('hex')

          attributes.password = encrypted
        }

        attributes.tables = JSON.stringify(attributes.tables)
        attributes.console = uuid.parse(attributes.console, new Buffer(16))

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
        attributes.tables = JSON.parse(attributes.tables)
        attributes.console = uuid.unparse(attributes.console)

        return attributes
      }
    })

  cb(null, model)
}
