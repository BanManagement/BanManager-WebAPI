global.Promise = require('bluebird')

require('dotenv').config()

const pino = require('pino')
const { randomBytes } = require('crypto')
const DBMigrate = require('db-migrate')
const setupPool = require('../../data/connections/setup-db-pool')
const setupServersPool = require('../../data/connections/servers-pool')
const { createServer, createPlayer } = require('../fixtures')
const loaders = require('../../data/loaders')
const { insert } = require('../../data/udify')
const { hash } = require('../../data/hash')

module.exports = async () => { // eslint-disable-line max-statements
  const dbName = 'bm_web_tests_' + randomBytes(4).toString('hex')
  const dbConfig =
    { driver: 'mysql'
    , connectionLimit: 1
    , host: process.env.DB_HOST
    , user: process.env.DB_USER
    , multipleStatements: true
    }
  const logger = pino(
    { name: 'banmanager-api-test'
    , level: 'silent'
    })
  let dbPool = await setupPool(dbConfig)

  await dbPool.execute(`CREATE DATABASE ${dbName}`)
  await dbPool.end()

  dbConfig.database = dbName

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool(dbConfig)

  // Run migrations, then 'test' migrations
  let dbmOpts = { config: { dev: dbConfig }, migrationsDir: '../../data/migrations' }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  await dbm.up()

  dbmOpts = { config: { dev: dbConfig }, migrationsDir: '../migrations' }
  dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.internals.argv['migrations-dir'] = './test/migrations' // @TODO see if official way of setting this?
  await dbm.up()

  // Create player console
  const playerConsole = createPlayer()
  // Create two users, logged in and admin
  const loggedInUser = createPlayer()
  const adminUser = createPlayer()

  await insert(dbPool, 'bm_players', [ playerConsole, loggedInUser, adminUser ])

  await insert(dbPool, 'bm_web_player_roles',
    [ { 'player_id': loggedInUser.id, 'role_id': 2 }
    , { 'player_id': adminUser.id, 'role_id': 3 }
    ])

  await insert(dbPool, 'bm_web_users',
    [ { 'player_id': loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing') }
    , { 'player_id': adminUser.id, email: 'admin@banmanagement.com', password: await hash('testing') }
    ])

  // Create a server
  const server = createServer(playerConsole.id, dbName)

  await insert(dbPool, 'bm_web_servers', server)

  const serversPool = await setupServersPool(dbPool, logger, true)
  const teardown = async () => {
    for (let server in serversPool.values()) {
      await server.pool.end()
    }

    await dbPool.execute(`DROP DATABASE ${dbName}`)
    await dbPool.end()
  }

  return {
    dbPool
  , logger
  , serversPool
  , teardown
  , loaders: loaders({ state: { serversPool, dbPool } })
  , server
  }
}
