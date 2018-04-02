const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('/register', function () {
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

  it('should not error if not logged in', async function () {
    const { statusCode } = await request
      .post('/logout')
      .set('Accept', 'application/json')

    assert.equal(statusCode, 204)
  })

  it('should logout', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { statusCode } = await request
      .post('/logout')
      .set('Cookie', cookie)
      .expect('Set-Cookie', /bm-ui-sess/)
      .set('Accept', 'application/json')

    assert.equal(statusCode, 204)
  })
})
