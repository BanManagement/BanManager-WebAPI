const { parse } = require('uuid-parse')

module.exports = {
  Player: {
    name: {
      async resolve ({ id }, args, { state: { serversPool, loaders } }) {
        const results = await Promise.map(serversPool.values(), async (server) => {
          const table = server.config.tables.players
          const [ rows ] = await server.execute(`SELECT * FROM ${table} WHERE id = ?`, [ parse(id, new Buffer(16)) ])

          return rows
        })
          .reduce((prev, cur) => prev.concat(cur))

        const [ { name } ] = results

        return name
      }
    },
    roles: {
      async resolve ({ id }, args, { state: { dbPool, loaders } }) {
        const [results] = await dbPool.execute('SELECT role_id FROM bm_web_player_roles WHERE player_id = ?',
          [ parse(id, new Buffer(16)) ])

        return loaders.role.ids.loadMany(results.map(row => row.role_id))
      }
    },
    serverRoles: {
      async resolve ({ id }, args, { state: { dbPool, loaders } }) {
        const [results] = await dbPool.execute('SELECT role_id FROM bm_web_player_server_roles WHERE player_id = ?',
          [ parse(id, new Buffer(16)) ])

        return loaders.role.ids.loadMany(results.map(row => row.role_id))
      }
    },
    email: {
      async resolve ({ id }, args, { state: { dbPool } }) {
        const [[result]] = await dbPool.execute('SELECT email FROM bm_web_users WHERE player_id = ?',
          [ parse(id, new Buffer(16)) ])

        return result ? result.email : null
      }
    },
    lastSeen: {
      async resolve ({ id }, args, { state: { serversPool, loaders } }) {
        const results = await Promise.map(serversPool.values(), async (server) => {
          const table = server.config.tables.players
          const [ rows ] = await server.execute(`SELECT * FROM ${table} WHERE id = ?`, [ parse(id, new Buffer(16)) ])

          return rows
        })
          .reduce((prev, cur) => prev.concat(cur))

        const [ { lastSeen } ] = results

        return lastSeen
      }
    }
  }
}
