const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query adminNavigation', function () {
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
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `query adminNavigation {
        adminNavigation {
          left {
            id
            name
            label
            href
          }
        }
      }` })

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.deepStrictEqual(body.data.adminNavigation.left,
      [ { id: '1', name: 'Roles', label: 3, href: '/admin/roles' },
        { id: '2', name: 'Servers', label: 1, href: '/admin/servers' },
        { id: '3', name: 'Page Layouts', label: 1, href: '/admin/page-layouts' }
      ])
  })
})
