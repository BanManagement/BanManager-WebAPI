var uuid = require('uuid')

module.exports = function PlayerModel(cb) {
  function Model(server) {
    var model = server.db.Model.extend(
      { tableName: server.attributes.tables.players
      , hasTimestamps: false
      , hidden: [ 'ip' ]
      , format: function (attributes) {
          if (attributes.id) attributes.id = uuid.parse(attributes.id, new Buffer(16))

          return attributes
        }
      , parse: function (attributes) {
          if (attributes.id) attributes.id = uuid.unparse(attributes.id)

          return attributes
        }
      })

    return model

  }

  cb(null, Model)
}
