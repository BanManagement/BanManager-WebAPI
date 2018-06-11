const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')

describe('Mutation updatePageLayout', function () {
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
      .send({ query: `mutation updatePageLayout {
        updatePageLayout(pathname: "player", input: { mobile: [], tablet: [], desktop: []}) {
          pathname
        }
      }`})

    assert.equal(statusCode, 200)

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
      .send({ query: `mutation updatePageLayout {
        updatePageLayout(pathname: "player", input: { mobile: [], tablet: [], desktop: []}) {
          pathname
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  it('should error if page layout does not exist', async function () {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: `mutation updatePageLayout {
        updatePageLayout(pathname: "foo", input: { mobile: [], tablet: [], desktop: []}) {
          pathname
        }
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Page Layout does not exist')
  })

  it('should update page layout', async function () {
    const mobile = [{ id: '1', component: 'PlayerHeader', y: 0, x: 0, w: 5 },
      { id: '4', component: 'PlayerPunishmentList', y: 2, x: 0, w: 5 },
      { id: '7', component: 'PlayerIpList', y: 1, x: 0, w: 5 },
      { id: '10', component: 'PlayerHistoryList', y: 3, x: 0, w: 5 },
      { id: '13', component: 'PlayerAlts', y: 4, x: 0, w: 5 }]
    const query = jsonToGraphQLQuery({
      mutation: {
        updatePageLayout:
          { __args:
            { pathname: 'player'
            , input: { mobile, desktop: [], tablet: [] }
            }
          , pathname: true
          , devices:
            { mobile:
              { id: true
              , component: true
              , x: true
              , y: true
              , w: true
              }
            }
          }
      }
    })
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.equal(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.updatePageLayout.pathname, 'player')
    assert.deepStrictEqual(body.data.updatePageLayout.devices.mobile, mobile)
  })
})
