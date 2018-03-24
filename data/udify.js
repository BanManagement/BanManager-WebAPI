// (U)pdates, (D)eletes and (I)nserts
// Reads should be done seperately via loaders or native SELECT queries

// @TODO Replace with knex or a lighter query builder
module.exports =
{ update
, async delete(pool, table, where) {

  }
, insert
}

async function insert(pool, table, entity) {
  if (Array.isArray(entity)) {
    return Promise
      .each(entity, entity => insert(pool, table, entity))
  }

  const columns = Object.keys(entity).map(key => `\`${key}\``)
  const values = Object.values(entity)
  const query = `INSERT INTO \`${table}\`
    (${columns.join()})
    VALUES (${buildParams(values)})` // @TODO Escape column names

    return await pool.execute(query, values)
}

async function update(pool, table, entity, where) {
  let values = []
  let query = `UPDATE \`${table}\` SET `

  Object.keys(entity).forEach(column => {
    query += `\`${column}\` = `

    if (entity[column] === 'UNIX_TIMESTAMP()') {
      query += 'UNIX_TIMESTAMP(),'
    } else {
      values.push(entity[column])
      query += '?,'
    }
  })

  query = query.slice(0, -1)

  if (where) {
    query += ' WHERE '

    Object.keys(where).forEach(col => {
      query += `\`${col}\` = ?` // @TODO Escape column names
    })

    values = [ ...values, ...Object.values(where) ]
  }

  return await pool.execute(query, values)
}

function buildParams(columns) {
  return columns.map(() => '?').join(', ')
}
