const yargs = require('yargs')

module.exports = (args) => {
  yargs(args)
    .usage('$0 <cmd> [args]')
    .commandDir('commands')
    .help()
    .argv
}
