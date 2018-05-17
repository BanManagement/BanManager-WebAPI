const { makeExecutableSchema } = require('graphql-tools')
const typeDefs = require('./types')
const resolvers = require('./graphql/resolvers')
const directiveResolvers = require('./graphql/directives')
const schemaDirectives = {
  constraint: require('graphql-constraint-directive')
}

module.exports = () => makeExecutableSchema({ typeDefs, resolvers, directiveResolvers, schemaDirectives })
