const assert = require('assert')
const { EOL } = require('os')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const tables = require('../data/tables')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query server', function () {
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

  it('should resolve all fields', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query player {
        server(id:"${server.id}") {
          id
          name
          host
          port
          database
          user
          console {
            id
          }
          tables {
            ${tables.join(EOL)}
          }
          timeOffset
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.server.id, server.id)
    assert.strictEqual(body.data.server.name, server.name)
    assert.strictEqual(body.data.server.host, '127.0.0.1')
    assert.strictEqual(body.data.server.port, 3306)
    assert.strictEqual(body.data.server.database, server.database)
    assert.strictEqual(body.data.server.user, 'root')
    assert.strictEqual(body.data.server.console.id, unparse(server.console))
    assert.deepStrictEqual(body.data.server.tables, server.tables)
    assert.strictEqual(body.data.server.timeOffset, 0)
  })

  it('should error if server not found', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query player {
        server(id:"1") {
          id
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.server, null)
    assert.strictEqual(body.errors[0].message, 'Server not found')
  })

})
