const assert = require('assert')
const { find } = require('lodash')

module.exports = (field, name, args) => {
  assert('directives' in field.astNode, 'No directives found')
  assert(field.astNode.directives.length, 'No directives found')

  const directive = find(field.astNode.directives, { name: { value: name } })

  assert(directive, `Directive ${name} not found`)

  if (!args) return

  Object.keys(args).forEach(name => {
    const arg = find(directive.arguments, { name: { value: name } })

    assert(arg, `Missing ${name} directive argument`)
    assert.strictEqual(arg.value.value, args[name], `Incorrect ${name} directive argument value`)
  })
}
