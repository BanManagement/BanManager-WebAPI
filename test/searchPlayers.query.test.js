const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const {
  createPlayer
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Query searchPlayers', function () {
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
    const { pool } = setup.serversPool.values().next().value

    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query players {
        searchPlayers(name:"${player.name.substr(0, 3)}") {
          id
          name
          lastSeen
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.searchPlayers.length, 1)
    assert.strictEqual(body.data.searchPlayers[0].id, unparse(player.id))
    assert.strictEqual(body.data.searchPlayers[0].name, player.name)
    assert.strictEqual(body.data.searchPlayers[0].lastSeen, player.lastSeen)
  })
})
