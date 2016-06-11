var assert = require('assert')
var currentEnv = process.env.NODE_ENV

describe('Config', function () {
  beforeEach(function () {
    var resolved = require.resolve('app/config')

    delete require.cache[resolved]
  })

  after(function () {
    process.env.NODE_ENV = currentEnv
  })

  it('should throw an error if incorrect environment', function () {
    process.env.NODE_ENV = 'nope'
    assert.throws(function () {
      require('app/config')
    }, /No config for environment 'nope'/)
  })

  it('should throw an error if secret key not set', function () {
    process.env.NODE_ENV = 'production'
    assert.throws(function () {
      require('app/config')
    }, /You must change the default secretKey/)
  })
})
