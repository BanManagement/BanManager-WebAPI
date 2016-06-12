var mysql = require('mysql2')
  , async = require('async')
  , existsQuery = 'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'

module.exports = function (config, tables, callback) {
  var connection = mysql.createConnection(config)

  connection.connect(function (error) {
    if (error) return callback(error)

    async.eachSeries(tables, function (table, cb) {
      connection.query(existsQuery, [ config.database, table ], function (error, rows) {
        if (error) return cb(error)
        if (rows[0].exists) return cb()

        cb(new Error('Table ' + table + ' does not exist'))
      })
    }, function (error) {
      connection.destroy()
      callback(error)
    })
  })
}
