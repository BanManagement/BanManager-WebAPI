const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer
  , createMute
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Query player mute', function () {
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
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const mute = createMute(player, actor)

    await insert(pool, 'bm_players', [player, actor])
    await insert(pool, 'bm_player_mutes', mute)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query playerMute {
        playerMute(id:"1", serverId: "${server.id}") {
          id
          reason
          created
          expires
          soft
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
    assert.deepStrictEqual(body.data.playerMute,
      {
        id: '1',
        reason: mute.reason,
        created: mute.created,
        expires: 0,
        soft: false,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: true, update: true, yours: false }
      })
  })
})
