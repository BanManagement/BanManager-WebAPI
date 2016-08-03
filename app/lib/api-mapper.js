var Mapper = require('jsonapi-mapper')

module.exports = function dataMapper(config, cb) {
  var map = new Mapper.Bookshelf(config.apiUrl
    , { keyForAttribute: function (key) {
          return key
        }
      , pluralizeType: false
      })

  cb(null, map.map.bind(map))
}
