
exports.up = function (knex) {
  return knex.schema.createTable('bm_web_servers', function (table) {
    table.string('id').notNullable().primary()
    table.string('name').notNullable().unique()
    table.string('host').notNullable()
    table.string('database').notNullable()
    table.string('user').notNullable()
    table.string('password').notNullable().default('')
    table.binary('console', 16).notNullable()
    table.json('tables').notNullable()
  })
}

exports.down = function (knex) {
  knex.schema.dropTable('bm_web_servers')
}
