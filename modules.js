var glob = require('glob')
  , list =
    [ __dirname + '/app/modules/db.js'
    , __dirname + '/app.js'
    , __dirname + '/app/**/models/*.js'
    ]
  , files = []

list.forEach(function (pattern) {
  files = files.concat(glob.sync(pattern))
})

module.exports = files
