module.exports = function BanModel(PlayerModel, cb) {
  function Model(Server) {
    var model = Server.db.Model.extend(
      { tableName: Server.attributes.tables.playerBans
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
