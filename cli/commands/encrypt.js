require('dotenv').config()

const inquirer = require('inquirer')
const crypto = require('../../data/crypto')

exports.command = 'encrypt'
exports.describe = 'Encrypt a value'
exports.builder = { value: { type: 'string' } }

// eslint-disable-next-line max-statements
exports.handler = async function () {
  const { value } = await inquirer.prompt([ { type: 'password', name: 'value', message: 'Value' } ])
  const encValue = await crypto.encrypt(process.env.ENCRYPTION_KEY, value)

  console.log(`Encrypted Value: ${encValue}`)
}
