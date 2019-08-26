const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa')
const depthLimit = require('graphql-depth-limit')
const reqLogger = require('koa-pino-logger')
const cors = require('@koa/cors')
const session = require('koa-session')
const schema = require('./schema')()
const loaders = require('./data/loaders')
const acl = require('./data/middleware/acl')
const routes = require('./routes')
const { valid } = require('./data/session')

module.exports = async (dbPool, logger, serversPool) => {
  const app = new Koa()
  const router = new Router()

  const sessionConfig =
    {
      key: process.env.SESSION_NAME,
      renew: true,
      httpOnly: true,
      decode (str) {
        const body = Buffer.from(str, 'base64').toString('utf8')
        const json = JSON.parse(body)

        if (json.playerId && json.playerId.type === 'Buffer') json.playerId = Buffer.from(json.playerId.data)

        return json
      },
      sameSite: 'lax',
      domain: process.env.SESSION_DOMAIN,
      valid (session, data) {
        return valid(data)
      }
    }

  app.keys = [process.env.SESSION_KEY]

  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      ctx.log.error(err)

      ctx.status = err.status || 500
      ctx.body = { error: err.expose ? err.message : 'Internal Server Error' }
      ctx.app.emit('error', err, ctx)
    }
  })

  app.use(async (ctx, next) => {
    ctx.state.dbPool = dbPool
    ctx.state.serversPool = serversPool
    ctx.state.loaders = loaders(ctx)

    return next()
  })

  app.use(reqLogger())
  app.use(bodyParser())
  app.use(cors({ origin: process.env.SITE_HOST, credentials: true, maxAge: 600 }))
  app.use(session(sessionConfig, app))
  app.use(acl)

  const graphqlOpts = async ({ state, session, log }) => {
    return {
      schema,
      context: { state, session, log },
      cacheControl: true,
      formatError (error) {
        if (error.originalError && error.originalError.exposed) {
          return error
        }

        if (error.originalError && error.originalError.code === 'ERR_GRAPHQL_CONSTRAINT_VALIDATION') {
          const { fieldName, message } = error.originalError

          return { ...error, message: `${fieldName} ${message}` }
        }

        logger.error(error)

        return { message: 'Internal Server Error' }
      },
      validationRules: [depthLimit(10)]
    }
  }

  router.post('/graphql', graphqlKoa(graphqlOpts))
  router.get('/graphql', graphqlKoa(graphqlOpts))

  if (process.env.NODE_ENV !== 'production') {
    router.get('/graphiql', graphiqlKoa({
      endpointURL: '/graphql'
    }))
  }

  routes(router)

  app.use(router.routes())
  app.use(router.allowedMethods())
  app.use(async (ctx) => {
    if (ctx.status === 404) {
      ctx.status = 404
      ctx.body = { error: 'Not Found' }
    }
  })

  return app
}
