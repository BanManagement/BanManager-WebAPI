var crypto = require('crypto')
  , uuid = require('uuid')

module.exports = function SessionModel(db, cb) {
  var model = db.Model.extend(
    { tableName: 'bm_web_sessions'
    , hasTimestamps: false
    , format: function (attributes) {
        if (attributes.player_id) attributes['player_id'] = uuid.parse(attributes.player_id, new Buffer(16))

        return attributes
      }
    , parse: function (attributes) {
        if (attributes.player_id) attributes['player_id'] = uuid.unparse(attributes.player_id)

        return attributes
      }
    , generateId: function () {
        return crypto.randomBytes(24)
      }
    })

  cb(null, model)
}
