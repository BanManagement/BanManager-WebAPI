const assert = require('assert')
const { createPlayer } = require('./fixtures')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { insert } = require('../data/udify')

describe('Mutation delete role', function () {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 1) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should require servers.manage permission', async function () {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if role does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Role 123123 does not exist')
  })

  it('should not allow deleting guest role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 1) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You may not delete default roles')
  })

  it('should not allow deleting logged in role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 2) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You may not delete default roles')
  })

  it('should not allow deleting admin role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 3) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You may not delete default roles')
  })

  it('should delete role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await insert(setup.dbPool, 'bm_web_roles', { name: 'Test', parent_role_id: 2 })
    await insert(setup.dbPool, 'bm_web_player_roles', { player_id: player.id, role_id: 4 })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteRole {
        deleteRole(id: 4) {
          id
          name
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.deleteRole.id, '4')
    assert.strictEqual(body.data.deleteRole.name, 'Test')

    const [results] = await setup.dbPool.execute('SELECT * FROM bm_web_player_roles WHERE player_id = ?'
      , [player.id])

    assert.strictEqual(results.length, 0)
  })
})
