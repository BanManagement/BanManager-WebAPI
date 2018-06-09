const { insert } = require('../../../data/udify')

module.exports = async function updatePageLayout(obj, { pathname, input }, { log, state }) {
  const conn = await state.dbPool.getConnection()

  try {
    await conn.beginTransaction()
    await conn.execute('DELETE FROM bm_web_page_layouts WHERE pathname = ?', [ pathname ])

    const devices = Object.keys(input)
    const components = []

    devices.forEach(device => {
      input[device].forEach(({ component, x, y, w, textAlign, colour, meta }) => {
        const data = {
          pathname
        , device
        , component: component
        , x
        , y
        , w
        , textAlign
        , colour
        , meta
        }

        components.push(data)
      })
    })

    await insert(conn, 'bm_web_page_layouts', components)

    await conn.commit()
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      conn.rollback()
    }
  } finally {
    conn.release()
  }

  return { pathname }
}
