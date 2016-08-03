module.exports = function BanRecordModel(cb) {
  function Model(Server) {
    var model = Server.db.Model.extend(
      { tableName: Server.attributes.tables.playerBanRecords
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
