const { groupBy } = require('lodash')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function pageLayout(obj, { pathname }, { state: { dbPool } }) {
  const [ results ] = await dbPool.execute('SELECT * FROM bm_web_page_layouts WHERE pathname = ?', [ pathname ])

  if (!results.length) throw new ExposedError('Page Layout not found')

  const devices = groupBy(results, 'device')

  return { pathname, devices }
}
