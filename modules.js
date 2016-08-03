var glob = require('glob')
  , list =
    [ __dirname + '/app/modules/db.js'
    , __dirname + '/app.js'
    , __dirname + '/app/**/models/*.js'
    , __dirname + '/app/**/collections/*.js'
    , __dirname + '/app/modules/authentication/strategy.js'
    , __dirname + '/app/lib/api-mapper.js'
    , __dirname + '/app/lib/parse-uuid.js'
    ]
  , files = []

list.forEach(function (pattern) {
  files = files.concat(glob.sync(pattern))
})

module.exports = files
