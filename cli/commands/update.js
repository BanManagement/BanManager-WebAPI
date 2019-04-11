require('dotenv').config()

const DBMigrate = require('db-migrate')

exports.command = 'update'
exports.describe = 'Update database schemas'
exports.builder = {}

// eslint-disable-next-line max-statements
exports.handler = async function () {
  const dbConfig = {
    connectionLimit: 1,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  }

  const dbm = DBMigrate.getInstance(true, dbConfig)

  await dbm.up()

  console.log('Database updated successfully')
}
