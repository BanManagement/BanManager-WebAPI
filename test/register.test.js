const assert = require('assert')
const supertest = require('supertest')
const nock = require('nock')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAuthPin } = require('./lib')
const { createPlayer } = require('./fixtures')
const { insert } = require('../data/udify')

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

  it('should error if not logged in', async function () {
    const { body, statusCode } = await request
      .post('/register')
      .set('Accept', 'application/json')
      .send({ email: 123, password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'You are not logged in')
  })

  it('should error if invalid email type', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 123, password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email type')
  })

  it('should error if invalid email address', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd', password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email address')
  })

  it('should error if email address too long', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ password: 'test',
        email: // eslint-disable-next-line
        'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
      })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email address')
  })

  it('should error if invalid password', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 123 })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password type')
  })

  it('should error if password too short', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 'aaaaa' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
  })

  it('should error if password too long', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com',
        password: // eslint-disable-next-line
        'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
      })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
  })

  it('should error if password too common/insecure', async function () {
    nock('https://api.pwnedpasswords.com')
      .get('/range/8843D')
      .reply(200, '7F92416211DE9EBB963FF4CE28125932878:11603')

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 'foobar' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'Commonly used password, please choose another')
  })

  it('should error if player has an account', async function () {
    nock('https://api.pwnedpasswords.com')
      .get('/range/DDE9E')
      .reply(200, '')

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'admin@banmanagement.com', password: 'testiasd' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'You already have an account')
  })

  it('should error if email address found', async function () {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await insert(server.pool, 'bm_players', player)

    nock('https://api.pwnedpasswords.com')
      .get('/range/DC724')
      .reply(200, '')

    const cookie = await getAuthPin(request, server, player)
    const { body, statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'admin@banmanagement.com', password: 'testing' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'You already have an account')
  })

  it('should register an account', async function () {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await insert(server.pool, 'bm_players', player)

    nock('https://api.pwnedpasswords.com')
      .get('/range/DC724')
      .reply(200, '')

    const cookie = await getAuthPin(request, server, player)
    const { statusCode } = await request
      .post('/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asda123.com', password: 'testing' })

    assert(nock.isDone())
    assert.strictEqual(statusCode, 204)
  })
})
