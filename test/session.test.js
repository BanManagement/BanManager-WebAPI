const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuth } = require('./lib')
const { createPlayer } = require('./fixtures')
const { insert } = require('../data/udify')
const { hash } = require('../data/hash')

describe('/session', function () {
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

  describe('Password', function () {
    it('should error if invalid email type', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 123, password: 'test' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid email type')
    })

    it('should error if invalid email address', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd', password: 'test' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid email address')
    })

    it('should error if email address too long', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ password: 'test', email: // eslint-disable-next-line
          'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
        })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid email address')
    })

    it('should error if invalid password', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 123 })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid password type')
    })

    it('should error if password too short', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 'aaaaa' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
    })

    it('should error if password too long', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: // eslint-disable-next-line
          'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
        })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
    })

    it('should error if email address not found', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 'testing' })

      assert.equal(statusCode, 400)

      assert(body)
      console.log(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    it('should error if password does not match', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ email: 'admin@banmanagement.com', password: 'testiasd' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    it('should set a cookie on success', async function () {
      const { statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .expect('Set-Cookie', /bm-ui-sess/)
        .send({ email: 'admin@banmanagement.com', password: 'testing' })

      assert.equal(statusCode, 204)
    })
  })

  describe('Pin', function () {
    it('should error if invalid name', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 1 })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    it('should error if invalid name', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: '#yar' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    it('should error if name too long', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'testinglotsofthings' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    it('should error if invalid pin', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: 123 })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin type')
    })

    it('should error if pin too short', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '1234' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin, must be 6 characters')
    })

    it('should error if pin too long', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '123456789' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin, must be 6 characters')
    })

    it('should error if server not found', async function () {
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '123456', serverId: 'a' })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Server does not exist')
    })

    it('should error if name not found', async function () {
      const { config: server } = setup.serversPool.values().next().value
      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: 'yargasd', pin: '123456', serverId: server.id })

      assert.equal(statusCode, 400)

      assert(body)
      console.log(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    it('should error if pin does not match', async function () {
      const { config: server, pool } = setup.serversPool.values().next().value
      const player = createPlayer()

      await insert(pool, 'bm_players', player)
      await insert(pool, 'bm_player_pins', { 'player_id': player.id, pin: await hash('123456'), expires: 0 })

      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .send({ name: player.name, pin: '123459', serverId: server.id })

      assert.equal(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    it('should set a cookie on success', async function () {
      const { config: server, pool } = setup.serversPool.values().next().value
      const player = createPlayer()

      await insert(pool, 'bm_players', player)
      await insert(pool, 'bm_player_pins', { 'player_id': player.id, pin: await hash('123456'), expires: 0 })

      const { body, statusCode } = await request
        .post('/session')
        .set('Accept', 'application/json')
        .expect('Set-Cookie', /bm-ui-sess/)
        .send({ name: player.name, pin: '123456', serverId: server.id })

      assert.equal(statusCode, 200)
      assert.strictEqual(body.hasAccount, false)
    })
  })
})
