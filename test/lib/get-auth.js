const assert = require('assert')

module.exports = async function (request, email, password) {
  const { header, statusCode } = await request
    .post('/session')
    .set('Accept', 'application/json')
    .send({ email, password: password || 'test' })

  assert.equal(statusCode, 204)

  const cookie = header['set-cookie'].join(';')

  return cookie
}
