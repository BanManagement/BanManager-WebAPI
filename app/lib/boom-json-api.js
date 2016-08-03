module.exports = function () {
  function register(server, options, next) {
    server.ext('onPreResponse', function (req, reply) {
      var response = req.response

      if (!response.isBoom || (response.data && response.data.isJoi)) return reply.continue()

      var error =
        { title: response.output.payload.error
        , status: response.output.statusCode
        , detail: response.output.payload.message
        , source: { pointer: '/data' }
        }

      response.output.payload = { errors: [error] }

      return reply.continue()
    })

    next()
  }

  register.attributes = { name: 'boom-json-api' }

  return { register: register }
}
