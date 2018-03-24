const { readdirSync } = require('fs')
const { join } = require('path')
const { GraphQLScalarType } = require('graphql')
const importFunctions = require('../lib/import-functions')

const mutations = importFunctions(__dirname, 'mutations')

const queries = importFunctions(__dirname, 'queries')

const scalars = readdirSync(join(__dirname, 'scalars'))
  .reduce((files, file) => {
    const fn = require(join(__dirname, 'scalars', file))

    if (typeof fn !== 'object') return files

    if (fn instanceof GraphQLScalarType) {
      files[fn.name] = fn
    } else {
      files = { ...files, ...fn }
    }

    return files
  }, {})

module.exports = { Mutation: mutations, Query: queries, ...scalars }
