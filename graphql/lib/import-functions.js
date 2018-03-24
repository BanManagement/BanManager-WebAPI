const { readdirSync } = require('fs')
const { join } = require('path')

module.exports = function importFunctions(...dir) {
  return readdirSync(join(...dir)).reduce((files, file) => {
    const fn = require(join(...dir, file))

    if (typeof fn !== 'function') return files

    files[fn.name] = fn

    return files
  }, {})
}
