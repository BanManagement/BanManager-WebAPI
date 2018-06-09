const { filter, groupBy } = require('lodash')

module.exports = async function pageLayouts(obj, info, { state: { dbPool } }) {
  const [ results ] = await dbPool.execute('SELECT * FROM bm_web_page_layouts')

  const pageLayouts = Object.keys(groupBy(results, 'pathname')).map(pathname => {
    return {
      pathname: pathname
    , devices: groupBy(filter(results, { pathname: pathname }), 'device')
    }
  })

  return pageLayouts
}
