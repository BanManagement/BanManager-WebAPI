const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer,
  createMute
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Mutation update player mute', function () {
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
      .send({ query: `mutation updatePlayerMute {
        updatePlayerMute(id: "1", serverId: "1", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if server does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `mutation updatePlayerMute {
        updatePlayerMute(id: "1", serverId: "a", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Server does not exist')
  })

  it('should error if data does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `mutation updatePlayerMute {
        updatePlayerMute(id: "999999999", serverId: "${server.id}", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Player mute 999999999 does not exist')
  })

  it('should resolve all fields', async function () {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const mute = createMute(player, actor)

    await insert(pool, 'bm_players', [ player, actor ])
    const [ { insertId } ] = await insert(pool, 'bm_player_mutes', mute)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `mutation updatePlayerMute {
        updatePlayerMute(id: "${insertId}", serverId: "${server.id}", input: {
          reason: "testing updates",
          expires: 1000000000,
          soft: false
        }) {
          id
          reason
          created
          updated
          expires
          soft
          player {
            id
            name
          }
          actor {
            id
            name
          }
          acl {
            delete
            update
            yours
          }
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.updatePlayerMute.id, '1')
    assert.strictEqual(body.data.updatePlayerMute.reason, 'testing updates')
    assert.strictEqual(body.data.updatePlayerMute.expires, 1000000000)
    assert.strictEqual(body.data.updatePlayerMute.soft, false)
    assert.deepStrictEqual(body.data.updatePlayerMute.acl, { delete: true, update: true, yours: false })
  })
})
