var createKnex = require('knex')
  , bookshelf = require('bookshelf')
  , visibilityAcl = require('../lib/visibility-acl')

module.exports = function db(config, cb) {
  var knex = createKnex(
      { client: config.client
      , connection: config.connection
      , pool: config.pool
      , migrations: config.migrations
      , seeds: config.seeds
      , debug: true
      })
    , orm = bookshelf(knex)

  visibilityAcl(orm)
  orm.plugin('virtuals')

  cb(null, orm)
}
