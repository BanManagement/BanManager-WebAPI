const { writeFileSync } = require('fs')
const inquirer = require('inquirer')
const { createConnection } = require('mysql2/promise')
const DBMigrate = require('db-migrate')
const crypto = require('../../data/crypto')
const { generateServerId } = require('../../data/generator')
const { parse } = require('uuid-parse')
const { generateVAPIDKeys } = require('web-push')
const { hash } = require('../../data/hash')
const tables = require('../../data/tables')
const udify = require('../../data/udify')

exports.command = 'setup'
exports.describe = 'Setup API'
exports.builder = {}

// eslint-disable-next-line max-statements
exports.handler = async function () {
  // @TODO Check if API already set up, use values from env var if set as defaults
  console.log('Starting setup')
  console.log('If unsure, use default')
  const { siteHost, port, sessionName, sessionDomain, contactEmail } = await inquirer.prompt(
    [ { type: 'input', name: 'siteHost', message: 'BanManager UI Site Hostname', default: 'http://localhost:3000' },
      { type: 'input', name: 'port', message: 'Port to run API', default: 3001 },
      { type: 'input', name: 'sessionName', message: 'Cookie session name', default: 'bm-ui-sess' },
      { type: 'input',
        name: 'sessionDomain',
        message: 'Top level cookie session domain e.g. frostcast.net',
        default: 'localhost'
      },
      { type: 'input', name: 'contactEmail', message: 'Contact Email Address' }
    ])
  const encryptionKey = await crypto.createKey()
  const sessionKey = await crypto.createKey().toString('hex')
  const { publicKey, privateKey } = generateVAPIDKeys()
  const dbQuestions =
    [ { type: 'input', name: 'host', message: 'Database Host', default: '127.0.0.1' },
      { type: 'input', name: 'port', message: 'Database Port', default: 3306 },
      { type: 'input', name: 'user', message: 'Database User' },
      { type: 'password', name: 'password', message: 'Database Password' },
      { type: 'input', name: 'database', message: 'Database Name' }
    ]
  const dbAnswers = await inquirer.prompt(dbQuestions)
  const conn = await createConnection(dbAnswers)

  console.log(`Connected to ${dbAnswers.user}@${dbAnswers.host}:${dbAnswers.port}/${dbAnswers.database} successfully`)
  console.log('Setting up database...')

  const dbConfig =
    { ...dbAnswers,
      driver: 'mysql',
      connectionLimit: 1,
      multipleStatements: true
    }
  const dbmOpts = { config: { dev: dbConfig }, migrationsDir: '../../data/migrations' }
  const dbm = DBMigrate.getInstance(true, dbmOpts)

  await dbm.up()

  console.log('Add BanManager server')

  const { connection: serverConn, serverTables } = await promptServerDetails()

  const consoleId = await askPlayer('Console UUID (paste "uuid" value from BanManager/console.yml)', serverConn, serverTables.players)
  const { serverName } = await inquirer.prompt([ { name: 'serverName', message: 'Server Name' } ])
  const idKey = await generateServerId()
  const server =
    { id: idKey.toString('hex'),
      name: serverName,
      tables: JSON.stringify(serverTables),
      console: consoleId,
      host: serverConn.connection.config.host,
      port: serverConn.connection.config.port,
      user: serverConn.connection.config.user,
      password: serverConn.connection.config.password || '',
      database: serverConn.connection.config.database
    }

  if (server.password) {
    server.password = await crypto.encrypt(encryptionKey, server.password)
  }

  await udify.insert(conn, 'bm_web_servers', server)

  console.log('Setup your admin user')

  const { email } = await inquirer.prompt([ { name: 'email', message: 'Your email address' } ])
  const password = await askPassword()
  const playerId = await askPlayerAccount('Your Minecraft Player UUID', conn, serverConn, serverTables.players)
  const user = {
    email, password, 'player_id': playerId, updated: Math.floor(Date.now() / 1000)
  }

  await udify.insert(conn, 'bm_web_users', user)
  await udify.insert(conn, 'bm_web_player_roles', { 'player_id': playerId, 'role_id': 3 })

  console.log(`Account created, start the application and login via ${siteHost}/login`)

  const env = `
LOG_LEVEL=debug

PORT=${port}

ENCRYPTION_KEY=${encryptionKey.toString('hex')}

SESSION_KEY=${sessionKey}
SESSION_NAME=${sessionName}
SESSION_DOMAIN=${sessionDomain}

NOTIFICATION_VAPID_PUBLIC_KEY=${publicKey}
NOTIFICATION_VAPID_PRIVATE_KEY=${privateKey}

CONTACT_EMAIL=${contactEmail}

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

async function askPassword () {
  const { password, vPass } = await inquirer.prompt(
    [ { type: 'password', name: 'password', message: 'Password' },
      { type: 'password', name: 'vPass', message: 'Confirm Password' }
    ])

  if (!(password && vPass) || password !== vPass) {
    console.log('Passwords do not match')
    return askPassword()
  }

  return hash(password)
}

async function promptServerDetails () {
  const questions = [
    { name: 'host', message: 'BanManager databases.local host', default: '127.0.0.1' },
    { name: 'port', message: 'BanManager databases.local port', default: 3306 },
    { name: 'user', message: 'BanManager databases.local user' },
    { type: 'password', name: 'password', message: 'BanManager databases.local password' },
    { name: 'database', message: 'BanManager databases.local name' }
  ]
  const { host, port, user, password, database } = await inquirer.prompt(questions)
  let db
  let conn

  try {
    db =
      { host,
        port,
        user,
        password,
        database
      }
    conn = await createConnection(db)
  } catch (e) {
    console.error(e)
    console.log(`Failed to connect to ${db.user}@${db.host}:${db.port}/${db.database}`)
    return promptServerDetails()
  }

  console.log(`Connected to ${db.user}@${db.host}:${db.port}/${db.database} successfully`)

  const serverTables = {}

  for (let table of tables) {
    const tableName = await promptTable(conn, table)

    serverTables[table] = tableName
  }

  return { connection: conn, serverTables }
}

async function promptTable (conn, table) {
  const { tableName } = await inquirer.prompt([ { name: 'tableName', message: `${table} table name` } ])

  try {
    await checkTable(conn, tableName)
  } catch (e) {
    console.error(e)
    console.log(`Failed to find ${tableName} table in database, please try again`)

    return promptTable(conn, table)
  }

  return tableName
}

async function checkTable (conn, table) {
  const [ [ { exists } ] ] = await conn.execute(
    'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
    , [ conn.connection.config.database, table ])

  if (!exists) {
    throw new Error('Could not find table ' + table)
  }
}

// { type: 'input', name: 'name', message: 'Server Name', default: 'Frostcast' }
async function askPlayer (question, conn, table) {
  const questions = [ { name: 'id', message: question } ]
  const { id } = await inquirer.prompt(questions)
  const parsedId = parse(id, Buffer.alloc(16))

  const [ [ result ] ] = await conn.query(
    'SELECT name FROM ?? WHERE id = ?'
    , [ table, parsedId ])

  if (!result) {
    console.log(`Could not find Player ${id}`)
    return askPlayer(question, conn, table)
  }

  console.log(`Found player ${result.name}`)

  return parsedId
}

async function askPlayerAccount (question, conn, serverConn, table) {
  const id = await askPlayer(question, serverConn, table)

  const [ [ { exists } ] ] = await conn.execute(
    'SELECT COUNT(*) AS `exists` FROM bm_web_users WHERE player_id = ?'
    , [ id ])

  if (exists) {
    console.error('An account already exists for that player')
    return askPlayerAccount(question, conn, serverConn, table)
  }
}
