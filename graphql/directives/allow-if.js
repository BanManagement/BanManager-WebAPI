const { isNullableType } = require('graphql/type')
const { get } = require('lodash')
const ExposedError = require('../../data/exposed-error')

module.exports = async function allowIf(next, src
, { resource, permission, serverSrc, serverVar }
, { state: { acl } }, info) {
  const serverId = get(info.variableValues, serverVar) || get(src, serverSrc)
  let allowed = acl.hasPermission(resource, permission)

  if (serverId && acl.hasServerPermission(serverId, resource, permission)) allowed = true

  if (!allowed) {
    if (
      info.parentType.toString() === 'Query' || // Cover non-fields
      info.operation.operation === 'mutation' ||
      !isNullableType(info.returnType) // Cover non-nullable fields
    ) {
      throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
    }

    // @TODO Test more
    return null
  }

  return next()
}
