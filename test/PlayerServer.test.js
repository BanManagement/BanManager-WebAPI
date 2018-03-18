const assert = require('assert')
const {
  GraphQLNonNull
, GraphQLID
, GraphQLInt
, GraphQLList
} = require('graphql')
const schema = require('../schema')()
const Timestamp = require('../graphql/resolvers/scalars/timestamp')
const { assertHasDirective } = require('./lib')

describe('PlayerServer', async function () {
  const fields = schema.getType('PlayerServer').getFields()

  it('should have an id field of type ID', function () {
    assert('id' in fields)
    assert.deepStrictEqual(fields.id.type, GraphQLNonNull(GraphQLID))
  })

  it('should have a server field of type Server', function () {
    assert('server' in fields)
    assert.deepStrictEqual(fields.server.type, GraphQLNonNull(schema.getType('Server')))
  })

  it('should have a lastSeen field of type Timestamp', function () {
    assert('lastSeen' in fields)
    assert.deepStrictEqual(fields.lastSeen.type, GraphQLNonNull(Timestamp))
  })

  it('should have an ip field of type Int behind ACL', function () {
    assert('ip' in fields)
    assert.deepStrictEqual(fields.ip.type, GraphQLInt)
    assertHasDirective(fields.ip, 'allowIf', { resource: 'player.ips', permission: 'view' })
  })

  it('should have a bans field of type PlayerBan behind ACL', async function () {
    assert('bans' in fields)
    assert.deepStrictEqual(fields.bans.type, GraphQLList(GraphQLNonNull(schema.getType('PlayerBan'))))
    assertHasDirective(fields.bans, 'allowIf', { resource: 'player.bans', permission: 'view', serverSrc: 'id' })
  })

  it('should have a kicks field of type PlayerKick behind ACL', function () {
    assert('kicks' in fields)
    assert.deepStrictEqual(fields.kicks.type, GraphQLList(GraphQLNonNull(schema.getType('PlayerKick'))))
    assertHasDirective(fields.kicks, 'allowIf', { resource: 'player.kicks', permission: 'view', serverSrc: 'id' })
  })

  it('should have a mutes field of type PlayerMute behind ACL', function () {
    assert('mutes' in fields)
    assert.deepStrictEqual(fields.mutes.type, GraphQLList(GraphQLNonNull(schema.getType('PlayerMute'))))
    assertHasDirective(fields.mutes, 'allowIf', { resource: 'player.mutes', permission: 'view', serverSrc: 'id' })
  })

  it('should have a notes field of type PlayerNote behind ACL', function () {
    assert('notes' in fields)
    assert.deepStrictEqual(fields.notes.type, GraphQLList(GraphQLNonNull(schema.getType('PlayerNote'))))
    assertHasDirective(fields.notes, 'allowIf', { resource: 'player.notes', permission: 'view', serverSrc: 'id' })
  })

  it('should have a warnings field of type PlayerWarning behind ACL', function () {
    assert('warnings' in fields)
    assert.deepStrictEqual(fields.warnings.type, GraphQLList(GraphQLNonNull(schema.getType('PlayerWarning'))))
    assertHasDirective(fields.warnings, 'allowIf', { resource: 'player.warnings', permission: 'view', serverSrc: 'id' })
  })

  it('should have an acl field of type PlayerServerACL', function () {
    assert('acl' in fields)
    assert.deepStrictEqual(fields.acl.type, GraphQLNonNull(schema.getType('PlayerServerACL')))
  })
})
