module.exports = function (ServerModel) {
  return function (server, options, cb) {
    server.route(
      { method: 'GET'
      , path: '/'
      , handler: function (req, reply) {
          ServerModel.fetchAll().then(function (servers) {
            reply(servers.toJSON())
          }).catch(function (error) {
            reply(error)
          })
        }
      })

    server.route(
      { method: 'GET'
      , path: '/{id}'
      , handler: function (req, reply) {
          ServerModel
            .forge({ id: req.params.id })
            .fetch()
            .then(function (server) {
              if (!server) return reply.code(404)

              reply(server.toJSON())
            }).catch(function (error) {
              reply(error)
            })
        }
      })

    // server.post('/', function (req, res, next) {
    //   // Create a server
    // })

    // server.patch('/', function (req, res, next) {
    //   // Update a server
    // })

    // server.delete('/', function (req, res, next) {
    //   // Delete a server
    // })
    cb()
  }
}
