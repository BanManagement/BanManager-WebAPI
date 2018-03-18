const logoutRoute = require('./logout')
const sessionRoute = require('./session')
const registerRoute = require('./register')

module.exports = (router) => {
  router
    .post('/session', sessionRoute)
    .post('/logout', logoutRoute)
    .post('/register', registerRoute)
}
