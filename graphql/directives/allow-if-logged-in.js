const { valid } = require('../../data/session')
const ExposedError = require('../../data/exposed-error')

module.exports = async function allowIfLoggedIn (next, src, args, { session }) {
  if (!valid(session)) {
    throw new ExposedError(
      'You do not have permission to perform this action, please contact your server administrator')
  }

  return next()
}
