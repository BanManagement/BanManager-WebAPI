const { writeFileSync } = require('fs')
const inquirer = require('inquirer')
const { createConnection } = require('mysql2/promise')
const DBMigrate = require('db-migrate')
const { createCipher, randomBytes } = require('crypto')
const { parse } = require('uuid-parse')
const { hash } = require('../../data/hash')
const { safeLoad } = require('js-yaml')
const tables = require('../../data/tables')
const udify = require('../../data/udify')

exports.command = 'setup'
exports.describe = 'Setup API'
exports.builder = {}

// eslint-disable-next-line max-statements
exports.handler = async function () {
  console.log('Starting setup')
  console.log('If unsure, use default')
  const { siteHost, port, sessionName, sessionDomain } = await inquirer.prompt(
    [ { type: 'input', name: 'siteHost', message: 'BanManager UI Site Hostname', default: 'http://localhost:3000' }
    , { type: 'input', name: 'port', message: 'Port to run API', default: 3001 }
    , { type: 'input', name: 'sessionName', message: 'Cookie session name', default: 'bm-ui-sess' }
    , { type: 'input'
      , name: 'sessionDomain'
      , message: 'Top level cookie session domain e.g. frostcast.net'
      , default: 'localhost'
      }
    ])
  const encryptionAlg = 'aes-256-ctr'
  const encryptionKey = randomBytes(32).toString('hex')
  const sessionKey = randomBytes(32).toString('hex')
  const dbQuestions =
    [ { type: 'input', name: 'host', message: 'Database Host', default: '127.0.0.1' }
    , { type: 'input', name: 'port', message: 'Database Port', default: 3306 }
    , { type: 'input', name: 'user', message: 'Database User' }
    , { type: 'password', name: 'password', message: 'Database Password' }
    , { type: 'input', name: 'database', message: 'Database Name' }
    ]
  const dbAnswers = await inquirer.prompt(dbQuestions)
  const conn = await createConnection(dbAnswers)

  console.log(`Connected to ${dbAnswers.user}@${dbAnswers.host}:${dbAnswers.port}/${dbAnswers.database} successfully`)
  console.log('Setting up database...')

  const dbConfig =
    { ...dbAnswers
    , driver: 'mysql'
    , connectionLimit: 1
    , multipleStatements: true
    }
  const dbmOpts = { config: { dev: dbConfig }, migrationsDir: '../../data/migrations' }
  const dbm = DBMigrate.getInstance(true, dbmOpts)

  await dbm.up()

  console.log('Add BanManager server')

  const { connection: serverConn, serverTables } = await promptServerDetails()

  const consoleId = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, serverTables.players)
  const { serverName } = await inquirer.prompt([ { name: 'serverName', message: 'Server Name' } ])
  const server =
    { id: randomBytes(4).toString('hex')
    , name: serverName
    , tables: JSON.stringify(serverTables)
    , console: consoleId
    , host: serverConn.connection.config.host
    , port: serverConn.connection.config.port
    , user: serverConn.connection.config.user
    , password: serverConn.connection.config.password || ''
    , database: serverConn.connection.config.database
    }

  if (server.password) {
    const cipher = createCipher(encryptionAlg, encryptionKey)
    let encrypted = cipher.update(server.password, 'utf8', 'hex')

    encrypted += cipher.final('hex')

    server.password = encrypted
  }

  await udify.insert(conn, 'bm_web_servers', server)

  console.log('Setup your admin user')

  const { email } = await inquirer.prompt([ { name: 'email', message: 'Your email address' } ])
  const password = await askPassword()
  const playerId = await askPlayer('Your Minecraft Player UUID', conn, serverTables.players)
  const user = {
    email, password, 'player_id': playerId
  }

  await udify.insert(conn, 'bm_web_users', user)
  await udify.insert(conn, 'bm_web_player_roles', { 'player_id': playerId, 'role_id': 3 })

  console.log(`Account created, login via ${siteHost}/login`)

  const env = `
LOG_LEVEL=debug

PORT=${port}

ENCRYPTION_KEY=${encryptionKey}
ENCRYPTION_ALGORITHM=${encryptionAlg}

SESSION_KEY=${sessionKey}
SESSION_NAME=${sessionName}
SESSION_DOMAIN=${sessionDomain}

SITE_HOST=${siteHost}

DB_HOST=${dbAnswers.host}
DB_PORT=${dbAnswers.port}
DB_USER=${dbAnswers.user}
DB_PASSWORD=${dbAnswers.password}
DB_NAME=${dbAnswers.database}
DB_CONNECTION_LIMIT=5

`

  writeFileSync('./.env', env, 'utf8')

  console.log('Written .env to disk')

  console.log('Cleaning up...')

  await conn.end()
  await serverConn.end()

  console.log('Setup completed')
}

async function askPassword() {
  const { password, vPass } = await inquirer.prompt(
    [ { type: 'password', name: 'password', message: 'Password' }
    , { type: 'password', name: 'vPass', message: 'Confirm Password' }
    ])

  if (password !== vPass) {
    console.log('Passwords do not match')
    return await askPassword()
  }

  return await hash(password)
}

async function promptServerDetails() {
  const questions = [ { type: 'editor', name: 'yaml', message: 'Paste BanManager/config.yml' } ]
  const { yaml } = await inquirer.prompt(questions)
  let config

  try {
    config = safeLoad(yaml)
  } catch (e) {
    console.error(e)
    console.log('Invalid yaml')

    return await promptServerDetails()
  }

  if (!config || typeof config === 'string' || typeof config === 'number') {
    console.log('Invalid config')
    return await promptServerDetails()
  }

  let db

  try {
    db =
      { host: config.databases.local.host
      , port: config.databases.local.port
      , user: config.databases.local.user
      , password: config.databases.local.password
      , database: config.databases.local.name
      }
    const conn = await createConnection(db)

    console.log(`Connected to ${db.user}@${db.host}:${db.port}/${db.database} successfully`)
    const serverTables = {}

    for (let table of tables) {
      let tableName = config.databases.local.tables[table]

      if (table === 'playerReportLogs' || table === 'serverLogs') {
        const answer = await inquirer.prompt([ { name: 'tableName', message: `${table} table name` } ])

        tableName = answer.tableName
      }

      await checkTable(conn, tableName)

      serverTables[table] = tableName
    }

    return { connection: conn, serverTables }
  } catch (e) {
    console.error(e)
    console.log(`Failed to connect to ${db.user}@${db.host}:${db.port}/${db.database}`)
    return await promptServerDetails()
  }

}

async function checkTable(conn, table) {
  const [ [ { exists } ] ] = await conn.execute(
    'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
    , [ conn.connection.config.database, table ])

  if (!exists) {
    throw new Error('Could not find table ' + table)
  }
}

// { type: 'input', name: 'name', message: 'Server Name', default: 'Frostcast' }
async function askPlayer(question, conn, table) {
  const questions = [ { name: 'id', message: question } ]
  const { id } = await inquirer.prompt(questions)

  const [ [ result ] ] = await conn.query(
    'SELECT name FROM ?? WHERE id = ?'
    , [ table, parse(id, new Buffer(16)) ])

  if (!result) {
    console.log(`Could not find Player ${id}`)
    return await askPlayer(conn, table)
  }

  console.log(`Found player ${result.name}`)

  return parse(id, new Buffer(16))
}
