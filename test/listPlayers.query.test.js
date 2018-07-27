const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { find } = require('lodash')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer } = require('./fixtures')
const { insert } = require('../data/udify')

describe('Query listPlayers', function () {
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
    await server.close()
  })

  it('should error if unauthenticated', async function () {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers {
          total
          players {
            id
            name
            lastSeen
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if limit too large', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(limit: 51) {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Limit too large')
  })

  it('should error if offset greater than total', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(offset: 51) {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Offset greater than total')
  })

  it('should resolve all fields', async function () {
    const { pool, config: server } = setup.serversPool.values().next().value

    const player = createPlayer()

    await insert(pool, 'bm_players', player)
    await insert(setup.dbPool, 'bm_web_player_roles', { 'role_id': 2, 'player_id': player.id })
    await insert(setup.dbPool, 'bm_web_player_server_roles',
      { 'server_Id': server.id, 'role_id': 1, 'player_id': player.id })

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    const bodyPlayer = find(body.data.listPlayers.players, { id: unparse(player.id) })

    assert(bodyPlayer)

    assert.strictEqual(body.data.listPlayers.players.length, 3)
    assert.strictEqual(bodyPlayer.name, player.name)
    assert.strictEqual(bodyPlayer.lastSeen, player.lastSeen)

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].id, '2')
    assert.strictEqual(roles[0].name, 'Logged In')

    const serverRoles = bodyPlayer.serverRoles

    assert.strictEqual(serverRoles.length, 1)
    assert.strictEqual(serverRoles[0].id, '1')
    assert.strictEqual(serverRoles[0].name, 'Guest')
  })

  it('should filter role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(role: "adm") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    const bodyPlayer = body.data.listPlayers.players[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listPlayers.players.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].id, '3')
    assert.strictEqual(roles[0].name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })

  it('should filter role and return no results', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(role: "asd") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listPlayers.players.length, 0)
  })

  it('should filter email', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(email: "admin") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    const bodyPlayer = body.data.listPlayers.players[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listPlayers.players.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].id, '3')
    assert.strictEqual(roles[0].name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })

  it('should filter email and return no results', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(email: "asd") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listPlayers.players.length, 0)
  })

  it('should resolve filter server roles', async function () {
    const { pool, config: server } = setup.serversPool.values().next().value

    const player = createPlayer()

    await insert(pool, 'bm_players', player)
    await insert(setup.dbPool, 'bm_web_roles', { role_id: 4, name: 'Test', parent_role_id: 2 })
    await insert(setup.dbPool, 'bm_web_player_roles', { 'role_id': 2, 'player_id': player.id })
    await insert(setup.dbPool, 'bm_web_player_server_roles',
      { 'server_Id': server.id, 'role_id': 4, 'player_id': player.id })

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(serverRole: "tes") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    const bodyPlayer = body.data.listPlayers.players[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listPlayers.players.length, 1)
    assert.strictEqual(bodyPlayer.id, unparse(player.id))
    assert.strictEqual(bodyPlayer.name, player.name)
    assert.strictEqual(bodyPlayer.lastSeen, player.lastSeen)

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].id, '2')
    assert.strictEqual(roles[0].name, 'Logged In')

    const serverRoles = bodyPlayer.serverRoles

    assert.strictEqual(serverRoles.length, 1)
    assert.strictEqual(serverRoles[0].id, '4')
    assert.strictEqual(serverRoles[0].name, 'Test')
  })

  it('should filter server role and return no results', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(serverRole: "asd") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listPlayers.players.length, 0)
  })

  it('should filter email, role and server role', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query listPlayers {
        listPlayers(email: "admin", role: "admin", serverRole: "admin") {
          total
          players {
            id
            name
            email
            lastSeen
            roles {
              id
              name
            }
            serverRoles {
              id
              name
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)

    const bodyPlayer = body.data.listPlayers.players[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listPlayers.players.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].id, '3')
    assert.strictEqual(roles[0].name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })
})
