var assert = require('assert')
  , bootstrap = require('./bootstrap')
  , serverFixture = require('./fixtures/server')
  , server
  , createdServer

describe('/v1/server', function () {

  before(function (done) {
    bootstrap(function (error, app) {
      if (error) return done(error)

      server = app

      done()
    })
  })

  describe('POST /', function () {

    it('should return 400', function (done) {
      server.inject(
        { method: 'POST'
        , url: '/v1/server'
        , payload: {}
        }, function (res) {
          assert.equal(res.statusCode, 400)
          assert.equal(res.result.error, 'Bad Request')
          assert.deepEqual(res.result.validation.keys, [ 'name', 'host', 'database', 'user', 'console' ])

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'POST'
        , url: '/v1/server'
        , payload: serverFixture
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(Object.keys(res.result), [ 'name', 'id' ])

          createdServer = res.result

          done()
        })
    })

  })

  describe('GET /', function () {

    it('should return 200', function (done) {
      server.inject(
        { method: 'GET'
        , url: '/v1/server'
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(res.result, [ createdServer ])

          done()
        })
    })

  })

  describe('GET /{id}', function () {

    it('should return 404', function (done) {
      server.inject(
        { method: 'GET'
        , url: '/v1/server/fooooooworld'
        }, function (res) {
          assert.equal(res.statusCode, 404)
          assert.deepEqual(res.result, { statusCode: 404, error: 'Not Found' })

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'GET'
        , url: '/v1/server/' + createdServer.id
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(res.result, createdServer)

          done()
        })
    })

  })

})
