var assert = require('assert')
  , _ = require('lodash')
  , uuid = require('uuid')
  , bootstrap = require('./bootstrap')
  , serverFixture = require('./fixtures/server')
  , banFixture = require('./fixtures/ban')
  , server
  , createdServer
  , players
  , prefix

describe('/v1/server/{serverId}/ban', function () {

  before(function (done) {
    bootstrap(function (error, app) {
      if (error) return done(error)

      server = app

      server.inject(
        { method: 'POST'
        , url: '/v1/server'
        , payload: serverFixture()
        }, function (res) {
          createdServer = res.result
          prefix = '/v1/server/' + createdServer.id + '/ban'

          done()
        })
    })
  })

  before(function (done) {
    server.inject(
      { method: 'GET'
      , url: '/v1/search/player'
      }, function (res) {
        players = res.result.results

        done()
      })
  })

  after(function (done) {
    server.inject(
      { method: 'DELETE'
      , url: '/v1/server'
      , payload: createdServer.id
      }, function () {
        done()
      })
  })

  describe('POST /player', function () {

    it('should return 400', function (done) {
      server.inject(
        { method: 'POST'
        , url: prefix + '/player'
        , payload: {}
        }, function (res) {
          assert.equal(res.statusCode, 400)
          assert.equal(res.result.error, 'Bad Request')
          assert.deepEqual(res.result.validation.keys
            , [ 'player_id'
              , 'reason'
              , 'actor_id'
              , 'expires'
              ])

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'POST'
        , url: prefix + '/player'
        , payload: banFixture(players[0], players[1])
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(Object.keys(res.result)
            , [ 'player_id'
              , 'actor_id'
              , 'reason'
              , 'created'
              , 'updated'
              , 'expires'
              , 'id'
              ])

          createdServer = res.result

          done()
        })
    })

    it('should return 404', function (done) {
      server.inject(
        { method: 'POST'
        , url: prefix + '/player'
        , payload: _.merge({}, banFixture({ id: uuid.v4() }, { id: uuid.v4() }))
        }, function (res) {
          assert.equal(res.statusCode, 404)
          assert.equal(res.result.error, 'Not Found')
          assert.equal(res.result.message, 'Player not found')

          done()
        })
    })

  })

  describe.skip('GET /', function () {

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

  describe('GET /player/{id}', function () {

    it('should return 404', function (done) {
      server.inject(
        { method: 'GET'
        , url: prefix + '/player/9999'
        }, function (res) {
          assert.equal(res.statusCode, 404)
          assert.deepEqual(res.result, { statusCode: 404, error: 'Not Found' })

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'GET'
        , url: prefix + '/player/1'
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(Object.keys(res.result)
            , [ 'id'
              , 'player_id'
              , 'reason'
              , 'actor_id'
              , 'created'
              , 'updated'
              , 'expires'
              ])

          done()
        })
    })

  })

  describe('PATCH /player', function () {

    it('should return 404', function (done) {
      server.inject(
        { method: 'PATCH'
        , url: prefix + '/player'
        , payload: _.merge({}, banFixture(players[0], players[1]), { id: 9999 })
        }, function (res) {
          assert.equal(res.statusCode, 404)
          assert.deepEqual(res.result, { statusCode: 404, error: 'Not Found' })

          done()
        })
    })

    it('should return 400', function (done) {
      server.inject(
        { method: 'PATCH'
        , url: prefix + '/player'
        , payload: { id: 1 }
        }, function (res) {
          assert.equal(res.statusCode, 400)
          assert.equal(res.result.error, 'Bad Request')

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'PATCH'
        , url: prefix + '/player'
        , payload: _.merge({}, banFixture(players[0], players[1]), { id: 1, reason: 'updated yeah' })
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.equal(res.result.id, 1)
          assert.equal(res.result.reason, 'updated yeah')

          done()
        })
    })

  })

  describe('DELETE /player', function () {

    it('should return 404', function (done) {
      server.inject(
        { method: 'DELETE'
        , url: prefix + '/player/9999'
        }, function (res) {
          assert.equal(res.statusCode, 404)
          assert.deepEqual(res.result, { statusCode: 404, error: 'Not Found' })

          done()
        })
    })

    it('should return 200', function (done) {
      server.inject(
        { method: 'DELETE'
        , url: prefix + '/player/1'
        }, function (res) {
          assert.equal(res.statusCode, 200)
          assert.deepEqual(Object.keys(res.result), [ ])

          done()
        })
    })

  })

})
