const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')

describe('Query serverTables', function () {
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
      .send({ query: `query serverTables {
        serverTables
      }`})

    assert.equal(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.serverTables,
      [ 'players'
      , 'playerBans'
      , 'playerBanRecords'
      , 'playerMutes'
      , 'playerMuteRecords'
      , 'playerKicks'
      , 'playerNotes'
      , 'playerHistory'
      , 'playerPins'
      , 'playerReports'
      , 'playerReportCommands'
      , 'playerReportComments'
      , 'playerReportLocations'
      , 'playerReportStates'
      , 'playerReportLogs'
      , 'serverLogs'
      , 'playerWarnings'
      , 'ipBans'
      , 'ipBanRecords'
      , 'ipMutes'
      , 'ipMuteRecords'
      , 'ipRangeBans'
      , 'ipRangeBanRecords'
      ])
  })
})
