var createKnex = require('knex')
  , bookshelf = require('bookshelf')

module.exports = function db(config, logger, cb) {
  var knex = createKnex(
      { client: config.client
      , connection: config.connection
      , pool: config.pool
      , migrations: config.migrations
      })
    , orm = bookshelf(knex)

  orm.plugin('visibility')

  cb(null, orm)
}
