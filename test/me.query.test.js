const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query me', function () {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query me {
        me {
          id
          name
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)
    assert(body.data.me.id)
    assert(body.data.me.name)
  })

  it('should error if not logged in', async function () {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `query me {
        me {
          id
          name
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)

    assert.strictEqual(body.data.me, null)
    assert.strictEqual(body.errors[0].message, 'Invalid session')
  })

})
