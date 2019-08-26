const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer,
  createServer
} = require('./fixtures')

describe('Mutation delete server', function () {
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
    const { id } = createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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
    const { id } = createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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

  it('should error if server does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const { id } = createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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
      'Server does not exist')
  })

  it('should delete server', async function () {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id: config.id
            }
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
    assert.strictEqual(body.data.deleteServer, config.id)
  })
})
