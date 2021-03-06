const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const {
  createPlayer
  , createBan
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Query player ban', function () {
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
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const ban = createBan(player, actor)

    await insert(pool, 'bm_players', [player, actor])
    await insert(pool, 'bm_player_bans', ban)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query playerBan {
        playerBan(id:"1", serverId: "${server.id}") {
          id
          reason
          created
          expires
          actor {
            id
            name
          }
          acl {
            update
            delete
            yours
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.playerBan,
      {
        id: '1',
        reason: ban.reason,
        created: ban.created,
        expires: 0,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: false, update: false, yours: false }
      })
  })
})
