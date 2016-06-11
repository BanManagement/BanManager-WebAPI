var assert = require('assert')
  , bootstrap = require('./bootstrap')
  , server

describe('GET /server', function () {

  before(function (done) {
    bootstrap(function (error, app) {
      if (error) return done(error)

      server = app

      done()
    })
  })

  it('should return 200', function (done) {
    server.inject(
      { method: 'GET'
      , url: '/v1/server'
      }, function (res) {
        assert.equal(res.statusCode, 200)
        assert.deepEqual(res.result, [])

        done()
      })
  })

})
