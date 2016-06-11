var createKnex = require('knex')
  , bookshelf = require('bookshelf')

module.exports = function db(config, logger, cb) {
  var knex = createKnex({ client: 'mysql2', connection: config.connection })
    , orm = bookshelf(knex)

  orm.plugin('visibility')

  cb(null, orm)
}
