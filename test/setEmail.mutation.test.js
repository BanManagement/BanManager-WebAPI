const assert = require('assert')
const supertest = require('supertest')
const MockDate = require('mockdate')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation set email', function () {
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
    MockDate.reset()

    await setup.teardown()
    await server.close() // @TODO Should allow mocha to exit, but it's still hanging :S
  })

  it('should error if unauthenticated', async function () {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
        setEmail(currentPassword: "test", email: "test") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if current password not correct', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "notCorrect", email: "testing@test.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Incorrect login details')
  })

  it('should error if email invalid', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "notCorrect", email: "testing.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Invalid email address')
  })

  it('should error if password too short', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "test", email: "test") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Invalid password, minimum length 6 characters')
  })

  it('should error if email already used', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "testing", email: "admin@banmanagement.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You already have an account')
  })

  it('should update email', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "testing", email: "test@test.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body)

    const { body: body2, statusCode: statusCode2 } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
            email
          }
      }`
      })

    assert.strictEqual(statusCode2, 200)

    assert(body2)
    assert.strictEqual(body2.data.me.email, 'test@test.com')

    // Confirm old email address does not allow logins
    let errorThrown = false

    try {
      await getAuthPassword(request, 'admin@banmanagement.com')
    } catch (e) {
      assert.strictEqual(e.actual, 400)
      errorThrown = true
    } finally {
      assert(errorThrown)
    }
  })
})
