const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query navigation', function () {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `query navigation {
        navigation {
          left {
            id
            name
            href
          }
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.navigation.left,
      [ { id: '1', name: 'Home', href: '/' },
        { id: '2', name: 'Appeal', href: null },
        { id: '3', name: 'Reports', href: '/reports' },
        { id: '4', name: 'Statistics', href: '/statistics' }
      ])
  })

  it('should show admin link if user has servers.manage permission', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query navigation {
        navigation {
          left {
            id
            name
            href
          }
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.deepStrictEqual(body.data.navigation.left,
      [ { id: '1', name: 'Home', href: '/' },
        { id: '2', name: 'Appeal', href: null },
        { id: '3', name: 'Reports', href: '/reports' },
        { id: '4', name: 'Statistics', href: '/statistics' },
        { id: '5', name: 'Admin', 'href': '/admin' }
      ])
  })
})
