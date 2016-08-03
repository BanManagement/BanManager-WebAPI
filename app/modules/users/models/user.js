var uuid = require('uuid')

module.exports = function UserModel(db, cb) {
  var model = db.Model.extend(
    { tableName: 'bm_web_users'
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

  cb(null, model)
}
