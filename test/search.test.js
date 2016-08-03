var assert = require('assert')
  , bootstrap = require('./bootstrap')
  , serverFixture = require('./fixtures/server')
  , player
  , server

describe('/v1/search', function () {

  before(function (done) {
    bootstrap(function (error, app) {
      if (error) return done(error)

      server = app

      done()
    })
  })

  describe('GET /player', function () {

    it('should return all players', function (done) {
      server.inject(
        { method: 'GET'
        , url: '/v1/search/player'
        }, function (res) {
          assert.equal(res.statusCode, 200)

          assert.equal(res.result.total, 2)
          assert.equal(res.result.results.length, 2)

          player = res.result.results[0]

          assert.deepEqual(Object.keys(player), [ 'id', 'name', 'bans', 'mutes' ])

          done()
        })
    })

    it('should return filtered players', function (done) {
      server.inject(
        { method: 'GET'
        , url: '/v1/search/player?name=' + player.name.substring(0, 2)
        , payload: serverFixture
        }, function (res) {
          assert.equal(res.statusCode, 200)

          assert.equal(res.result.total, 1)
          assert.equal(res.result.results.length, 1)

          var player = res.result.results[0]

          assert.deepEqual(Object.keys(player), [ 'id', 'name', 'bans', 'mutes' ])

          done()
        })
    })
  })

})
