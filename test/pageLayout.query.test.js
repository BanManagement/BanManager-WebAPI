const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')

describe('Query pageLayout', function () {
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

  it('should error if layout does not exist', async function () {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `query pageLayout {
        pageLayout(pathname: "nope") {
          pathname
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Page Layout not found')
  })

  it('should resolve all fields', async function () {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query: `query pageLayout {
        pageLayout(pathname: "player") {
          pathname
          devices {
            mobile {
              id
              component
              x
              y
              w
              colour
              textAlign
              meta
            }
            tablet {
              id
              component
              x
              y
              w
              colour
              textAlign
              meta
            }
            desktop {
              id
              component
              x
              y
              w
              colour
              textAlign
              meta
            }
          }
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.pageLayout.pathname, 'player')
    assert.deepStrictEqual(body.data.pageLayout.devices, {
      mobile:
        [{
          id: '1',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '4',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '7',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '10',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '13',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }],
      tablet:
        [{
          id: '2',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '5',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '8',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '11',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '14',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }],
      desktop:
        [{
          id: '3',
          component: 'PlayerHeader',
          x: 0,
          y: 0,
          w: 16,
          colour: 'blue',
          textAlign: 'center',
          meta: null
        },
        {
          id: '6',
          component: 'PlayerPunishmentList',
          x: 0,
          y: 1,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '9',
          component: 'PlayerIpList',
          x: 0,
          y: 2,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '12',
          component: 'PlayerHistoryList',
          x: 0,
          y: 3,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        },
        {
          id: '15',
          component: 'PlayerAlts',
          x: 0,
          y: 4,
          w: 16,
          colour: null,
          textAlign: null,
          meta: null
        }]
    })
  })
})
