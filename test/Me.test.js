const assert = require('assert')
const { GraphQLBoolean, GraphQLNonNull, GraphQLString } = require('graphql')
const schema = require('../schema')()
const UUID = require('../graphql/resolvers/scalars/uuid')

describe('Me', function () {
  const fields = schema.getType('Me').getFields()

  it('should have an id field of type UUID', function () {
    assert('id' in fields)
    assert.deepStrictEqual(fields.id.type, GraphQLNonNull(UUID))
  })

  it('should have a name field of type String', function () {
    assert('name' in fields)
    assert.deepStrictEqual(fields.name.type, GraphQLNonNull(GraphQLString))
  })

  it('should have a hasAccount field of type Boolean', function () {
    assert('hasAccount' in fields)
    assert.deepStrictEqual(fields.hasAccount.type, GraphQLNonNull(GraphQLBoolean))
  })
})
