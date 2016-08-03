var uuid = require('uuid')

module.exports = function PinModel(cb) {
  function Model(Server) {
    var model = Server.db.Model.extend(
      { tableName: Server.attributes.tables.playerPins
      , hasTimestamps: false
      , format: function (attributes) {
          if (attributes.player_id) attributes['player_id'] = uuid.parse(attributes.player_id, new Buffer(16))

          return attributes
        }
      , parse: function (attributes) {
          if (attributes.player_id) attributes['player_id'] = uuid.unparse(attributes.player_id)

          return attributes
        }
      })

    return model

  }

  cb(null, Model)
}
