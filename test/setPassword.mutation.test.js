const assert = require('assert')
const supertest = require('supertest')
const MockDate = require('mockdate')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation set password', function () {
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
      .send({ query: `mutation setPassword {
        setPassword(newPassword: "test") {
          id
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if current password not provided', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(newPassword: "testing") {
            id
          }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Invalid password, minimum length 6 characters')
  })

  it('should error if current password not correct', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "notCorrect", newPassword: "testing") {
            id
          }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Incorrect login details')
  })

  it('should update password and invalidate all other sessions', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    MockDate.set(new Date(Date.now() - 5000))
    let oldCookie = await getAuthPassword(request, 'admin@banmanagement.com')

    assert.notStrictEqual(cookie, oldCookie)

    const { header, body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "testing", newPassword: "foobar") {
            id
          }
      }`})

    assert.equal(statusCode, 200)
    assert(body)

    MockDate.reset()

    oldCookie = header['set-cookie'].join(';')

    // Confirm other session invalid
    const { body: body2, statusCode: statusCode2 } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
          }
      }`})

    assert.equal(statusCode2, 200)

    assert(body2)

    assert.strictEqual(body2.errors[0].message,
      'Invalid session')

    // Confirm current session still valid
    const { body: body3, statusCode: statusCode3 } = await request
      .post('/graphql')
      .set('Cookie', oldCookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
          }
      }`})

    assert.equal(statusCode3, 200)

    assert(body3)
    assert(body3.data)
    assert(body3.data.me.id)
  })

})
