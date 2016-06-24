import { filterFilter } from './filter_filter'
function $FilterProvider ($provide) {
  // let filters = {}
  this.register = function (name, factory) {
    if (_.isObject(name)) {
      return _.map(name, (facFn, _name) => this.register(_name, facFn), this)
    }
    return $provide.factory(`${name}Filter`, factory)
  }
  this.$get = ['$injector', function ($injector) {
    return name => $injector.get(name + 'Filter')
  }]
  this.register('filter', filterFilter)
}
$FilterProvider.$inject = ['$provide']
export { $FilterProvider }
