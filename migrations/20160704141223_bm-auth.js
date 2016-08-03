
exports.up = function (knex) {
  return knex.schema
    .createTable('bm_web_sessions', function (table) {
      table.specificType('id', 'BINARY(24)').notNullable().primary()
      table.specificType('player_id', 'BINARY(16)').notNullable()
      table.specificType('token_hash', 'BINARY(4)').notNullable()
      table.integer('created', 10).notNullable().index()
      table.integer('expires', 10).notNullable().index()
      table.index([ 'id', 'token_hash' ])
    })
    .createTable('bm_web_users', function (table) {
      table.specificType('player_id', 'BINARY(16)').notNullable().primary()
      table.string('email').notNullable().index()
      table.string('display_name', 16).notNullable().index()
      table.specificType('password', 'BINARY(60)').nullable()
    })
}

exports.down = function (knex) {
  knex.schema.dropTable('bm_web_sessions')
  knex.schema.dropTable('bm_web_users')
}
