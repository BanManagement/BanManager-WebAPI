var assert = require('assert')
  , validateConnection = require('app/lib/validate-connection')

describe('Validate Connection', function () {

  it('should error on incorrect connection', function (done) {
    validateConnection({ host: '127.0.0.1', user: 'root', database: 'noExist' }, [], function (error) {
      assert.equal(error.message, 'Unknown database \'noexist\'')

      done()
    })
  })

  it('should error on missing table', function (done) {
    validateConnection({ host: '127.0.0.1', user: 'root', database: 'bm_web_test' }, [ 'noexist' ], function (error) {
      assert.equal(error.message, 'Table noexist does not exist')

      done()
    })
  })

})
