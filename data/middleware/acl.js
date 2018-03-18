const memoize = require('memoizee')
const { get } = require('lodash')

module.exports = async ({ session, state }, next) => {
  const { dbPool } = state
  let resourceValues = {}
  let serverResourceValues = {}
  let hasServerPermission = (serverId, resource, permission) => {
    return state.acl.hasPermission(resource, permission)
  }

  state.permissionValues = await loadPermissionValues(dbPool)

  if (!session || !session.playerId) {
    // They're a guest, load Guest role permissions
    resourceValues = await loadRoleResourceValues(dbPool, 1)
  } else {
    const [ playerRoleResults ] = await dbPool.execute(`
      SELECT
        r.name, rr.value
      FROM
        bm_web_role_resources rr
          INNER JOIN
        bm_web_resources r ON rr.resource_id = r.resource_id
          LEFT JOIN
        bm_web_player_roles pr ON pr.role_id = rr.role_id
      WHERE
        pr.player_id = ?`, [ session.playerId ])

        if (!playerRoleResults.length) {
      // They're a guest, load Guest role permissions
      resourceValues = await loadRoleResourceValues(dbPool, 1)
    } else {
      playerRoleResults.forEach((row) => {
        if (!resourceValues[row.name]) {
          resourceValues[row.name] = row.value
        } else {
          // Merge resource values, granting as many permissions as possible from duplicates
          // @TODO Test this
          const x = resourceValues[row.name]
          const y = row.value

          resourceValues[row.name] = x ^ ((x ^ y) & 1)
        }
      })
    }

    // Check server specific roles
    const [ serverRoleResults ] = await dbPool.execute(`
      SELECT
        r.name, rr.value, psr.server_id
      FROM
        bm_web_role_resources rr
          INNER JOIN
        bm_web_resources r ON rr.resource_id = r.resource_id
          LEFT JOIN
        bm_web_player_server_roles psr ON psr.role_id = rr.role_id
      WHERE
        psr.player_id = ?`, [ session.playerId ])

    if (serverRoleResults.length) {
      serverRoleResults.forEach((row) => {
        if (!serverResourceValues[row.server_id]) {
          serverResourceValues[row.server_id] = {}
          serverResourceValues[row.server_id][row.name] = row.value
        } else {
          // Merge resource values, granting as many permissions as possible from duplicates
          // @TODO Test this
          const server = serverResourceValues[row.server_id]
          const x = server[row.name]
          const y = row.value

          server[row.name] = x ^ ((x ^ y) & 1)
        }
      })

      hasServerPermission = (serverId, resource, permission) => {
        // Check if they have global permission
        if (state.acl.hasPermission(resource, permission)) return true

        let value = get(state.permissionValues, [ resource, permission ], 0)

        if (permission === '*') { // Support wildcards @TODO Test
          value = Number.MAX_SAFE_INTEGER
        }

        return !!(get(serverResourceValues, [serverId, resource], null) & value)
      }
    }
  }

  state.acl =
    { hasServerPermission
    , hasPermission(resource, permission) {
        let value = get(state.permissionValues, [ resource, permission ], 0)

        if (permission === '*') { // Support wildcards @TODO Test
          value = Number.MAX_SAFE_INTEGER
        }

        return !!(resourceValues[resource] & value)
      }
    , owns(actorId) {
        const playerId = get(session, 'player_id', null)

        return Buffer.isBuffer(playerId) && Buffer.isBuffer(actorId) && actorId.equals(playerId)
      }
    }

  return next()
}

async function loadRoleResourceValues(dbPool, roleId) {
  const [ results ] = await dbPool.execute(`
    SELECT
      r.name, rr.value
    FROM
      bm_web_role_resources rr
        INNER JOIN
      bm_web_resources r ON rr.resource_id = r.resource_id
    WHERE
      rr.role_id = ?`, [ roleId ])
  const resourceValues = {}

  results.forEach((row) => {
    resourceValues[row.name] = row.value
  })

  return resourceValues
}

async function loadPermissionValues(dbPool) {
  const load = async () => {
    const [ results ] = await dbPool.execute(`
      SELECT
        rp.resource_id, r.name AS resource_name, rp.name, rp.value
      FROM
        bm_web_resource_permissions rp
          INNER JOIN
        bm_web_resources r ON r.resource_id = rp.resource_id`)
    const permissionValues = {}

    results.forEach((row) => {
      if (!permissionValues[row.resource_name]) permissionValues[row.resource_name] = {}

      permissionValues[row.resource_name][row.name] = row.value
    })

    return permissionValues
  }

  // Cache for 5 minutes
  return memoize(load, { async: true, prefetch: true, maxAge: 300 * 1000 })()
}