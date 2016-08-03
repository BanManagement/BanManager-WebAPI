module.exports = function ServerCollection(ServerModel, callback) {
  var collection

  ServerModel
    .fetchAll()
    .then(function (collect) {
      collection = collect

      return collection.models
    })
    .map(function (model) {
      return model.triggerThen('fetched', model)
    })
    .then(function () {
      callback(null, collection)
    })
    .catch(function (error) {
      throw error
    })

}
