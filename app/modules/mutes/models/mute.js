var uuid = require('uuid')

module.exports = function MuteModel(cb) {
  function Model(Server) {
    var model = Server.db.Model.extend(
      { tableName: Server.attributes.tables.playerMutes
      , hasTimestamps: false
      , virtuals:
        { server: function () {
            return Server.attributes.id
          }

        }
      })

    return model

  }

  cb(null, Model)
}
