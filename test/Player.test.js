const assert = require('assert')
const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql')
const schema = require('../schema')()
const UUID = require('../graphql/resolvers/scalars/uuid')
const Timestamp = require('../graphql/resolvers/scalars/timestamp')

describe('Player', function () {
  const fields = schema.getType('Player').getFields()

  it('should have an id field of type UUID', function () {
    assert('id' in fields)
    assert.deepStrictEqual(fields.id.type, GraphQLNonNull(UUID))
  })

  it('should have a name field of type String', function () {
    assert('name' in fields)
    assert.deepStrictEqual(fields.name.type, GraphQLNonNull(GraphQLString))
  })

  it('should have a lastSeen field of type String', function () {
    assert('lastSeen' in fields)
    assert.deepStrictEqual(fields.lastSeen.type, GraphQLNonNull(Timestamp))
  })

  it('should have a servers field of type PlayerServer', function () {
    assert('servers' in fields)
    assert.deepStrictEqual(fields.servers.type, GraphQLNonNull(GraphQLList(GraphQLNonNull(schema.getType('PlayerServer')))))
  })
})
