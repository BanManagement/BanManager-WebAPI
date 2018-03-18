const assert = require('assert')
const { GraphQLID, GraphQLNonNull, GraphQLString } = require('graphql')
const schema = require('../schema')()
const Timestamp = require('../graphql/resolvers/scalars/timestamp')

describe('PlayerNote', function () {
  const fields = schema.getType('PlayerNote').getFields()

  it('should have an id field of type ID', function () {
    assert('id' in fields)
    assert.deepStrictEqual(fields.id.type, GraphQLNonNull(GraphQLID))
  })

  it('should have a player field of type Player', function () {
    assert('player' in fields)
    assert.deepStrictEqual(fields.player.type, GraphQLNonNull(schema.getType('Player')))
  })

  it('should have an actor field of type Player', function () {
    assert('actor' in fields)
    assert.deepStrictEqual(fields.actor.type, GraphQLNonNull(schema.getType('Player')))
  })

  it('should have a message field of type String', function () {
    assert('message' in fields)
    assert.deepStrictEqual(fields.message.type, GraphQLNonNull(GraphQLString))
  })

  it('should have a created field of type String', function () {
    assert('created' in fields)
    assert.deepStrictEqual(fields.created.type, GraphQLNonNull(Timestamp))
  })

  it('should have a server field of type Server', function () {
    assert('server' in fields)
    assert.deepStrictEqual(fields.server.type, GraphQLNonNull(schema.getType('Server')))
  })

  it('should have an acl field of type EntityACL', function () {
    assert('acl' in fields)
    assert.deepStrictEqual(fields.acl.type, GraphQLNonNull(schema.getType('EntityACL')))
  })

  it('should only expose certain fields', function () {
    assert.deepStrictEqual(Object.keys(fields)
      , [ 'id'
        , 'player'
        , 'actor'
        , 'message'
        , 'created'
        , 'server'
        , 'acl'
        ])
  })
})
