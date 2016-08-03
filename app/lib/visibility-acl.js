'use strict'

var _ = require('lodash')

module.exports = function (Bookshelf) {
  const proto = Bookshelf.Model.prototype
  const toJSON = proto.toJSON

  const Model = Bookshelf.Model.extend(
    { hidden: null
    , visible: null
    , constructor: function () {
        proto.constructor.apply(this, arguments)
        const options = arguments[1] || {}

        if (options.visible) {
          this.visible = _.clone(options.visible)
        }
        if (options.hidden) {
          this.hidden = _.clone(options.hidden)
        }
      }
    , toJSON: function (canSee) {
        let json = toJSON.apply(this, arguments)

        if (canSee) return json

        if (this.visible) {
          json = _.pick(json, this.visible)
        }

        if (this.hidden) {
          json = _.omit(json, this.hidden)
        }

        return json
      }

    })

  Bookshelf.Model = Model
}
