const { makeExecutableSchema } = require('graphql-tools')
const typeDefs = require('./types')
const resolvers = require('./graphql/resolvers')
const directiveResolvers = require('./graphql/directives')

module.exports = () => makeExecutableSchema({ typeDefs, resolvers, directiveResolvers })
