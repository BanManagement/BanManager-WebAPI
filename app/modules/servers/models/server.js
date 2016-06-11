module.exports = function ServerModel(db, cb) {
  var model = db.Model.extend(
    { tableName: 'bm_web_servers'
    , hasTimestamps: false
    , hidden: [ 'host', 'username', 'password', 'database' ]
    })

  cb(null, model)
}
