const assert = require('assert')
const
  {
    GraphQLBoolean
    , GraphQLFloat
    , GraphQLID
    , GraphQLNonNull
    , GraphQLString
  } = require('graphql')
const schema = require('../schema')()
const Timestamp = require('../graphql/resolvers/scalars/timestamp')

describe('PlayerWarning', function () {
  const fields = schema.getType('PlayerWarning').getFields()

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

  it('should have a reason field of type String', function () {
    assert('reason' in fields)
    assert.deepStrictEqual(fields.reason.type, GraphQLNonNull(GraphQLString))
  })

  it('should have a created field of type String', function () {
    assert('created' in fields)
    assert.deepStrictEqual(fields.created.type, GraphQLNonNull(Timestamp))
  })

  it('should have a updated field of type String', function () {
    assert('updated' in fields)
    assert.deepStrictEqual(fields.updated.type, GraphQLNonNull(Timestamp))
  })

  it('should have a expires field of type String', function () {
    assert('expires' in fields)
    assert.deepStrictEqual(fields.expires.type, GraphQLNonNull(Timestamp))
  })

  it('should have a read field of type Boolean', function () {
    assert('read' in fields)
    assert.deepStrictEqual(fields.read.type, GraphQLNonNull(GraphQLBoolean))
  })

  it('should have a points field of type Float', function () {
    assert('points' in fields)
    assert.deepStrictEqual(fields.points.type, GraphQLNonNull(GraphQLFloat))
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
      , ['id',
        'player',
        'actor',
        'reason',
        'created',
        'updated',
        'expires',
        'read',
        'points',
        'server',
        'acl'
      ])
  })
})
