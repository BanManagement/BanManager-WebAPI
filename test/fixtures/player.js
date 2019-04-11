const { date, name, internet, random } = require('faker')
const { parse } = require('uuid-parse')
const { toLong } = require('ip')
const generateUUID = require('uuid/v4')

module.exports = function () {
  return {
    id: parse(generateUUID(), Buffer.alloc(16)),
    name: name.firstName(),
    ip: toLong(internet.ip()),
    lastSeen: Math.round((new Date(date.past()).getTime() / 1000))
  }
}
