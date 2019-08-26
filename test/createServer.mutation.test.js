const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const { decrypt } = require('../data/crypto')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer,
  createServer
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Mutation create server', function () {
  let setup
  let server
  let request

  before(async function () {
    setup = await createSetup()
    const app = await createApp(setup.dbPool, setup.logger, setup.serversPool)

    server = app.listen()
    request = supertest(server)
  })

  after(async function () {
    await setup.teardown()
    await server.close() // @TODO Should allow mocha to exit, but it's still hanging :S
  })

  it('should error if unauthenticated', async function () {
    const player = createPlayer()
    const server = createServer(unparse(player.id), 'test')

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should require servers.manage', async function () {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), 'test')

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if tables missing', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)

    delete server.id
    server.tables = JSON.parse(server.tables)
    server.tables.players = 'doesNotExist'

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Tables do not exist in the database: players')
  })

  it('should error if console does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Console UUID not found in bm_players table')
  })

  it('should encrypt password', async function () {
    const { pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    // Create temp user
    await pool.execute('GRANT ALL PRIVILEGES ON *.* TO \'foobar\'@\'localhost\' IDENTIFIED BY \'password\';')
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)

    delete server.id
    server.user = 'foobar'
    server.password = 'password'
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    // Delete custom user
    await pool.execute('DELETE FROM mysql.user WHERE user = "foobar";')

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data.createServer.id)

    const [[result]] = await pool.execute('SELECT * FROM bm_web_servers WHERE id = ?'
      , [body.data.createServer.id])
    const decrypted = await decrypt(process.env.ENCRYPTION_KEY, result.password)

    assert.strictEqual(decrypted, 'password')
  })
})
