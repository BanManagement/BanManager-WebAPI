const { date, name, internet, random } = require('faker')
const { parse } = require('uuid-parse')
const { toLong } = require('ip')

module.exports = function () {
  return {
    id: parse(random.uuid(), new Buffer(16))
  , name: name.firstName()
  , ip: toLong(internet.ip())
  , lastSeen: Math.round((new Date(date.past()).getTime() / 1000))
  }
}
