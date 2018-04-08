const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer,
  createWarning
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Mutation create player warning', function () {
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
    const player = createPlayer()
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `mutation createPlayerWarning {
        createPlayerWarning(input: {
          player: "${unparse(player.id)}", reason: "test", server: "${server.id}", points: 1, expires: 1000000000
        }) {
          id
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should resolve all fields', async function () {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const warning = createWarning(player, actor)

    await insert(pool, 'bm_players', [ player, actor ])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `mutation createPlayerWarning {
        createPlayerWarning(input: {
          player: "${unparse(player.id)}",
          reason: "${warning.reason}",
          server: "${server.id}",
          points: 1,
          expires: 1000000000
        }) {
          id
          reason
          expires
          created
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
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.createPlayerWarning.id, '1')
    assert.strictEqual(body.data.createPlayerWarning.reason, warning.reason)
    assert.strictEqual(body.data.createPlayerWarning.expires, 1000000000)
    assert.deepStrictEqual(body.data.createPlayerWarning.acl, { delete: true, update: true, yours: false })
  })

})
