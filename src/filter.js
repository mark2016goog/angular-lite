import {filterFilter} from './filter_filter'
function $FilterProvider($provide){

  let filters = {}

  this.register = function(name, factory){
    if (_.isObject(name)) {
      return _.map(name,(factory, name)=>{
        return this.register(name,factory)
      },this)
    }else{
      return $provide.factory(name+'Filter',factory)
      // let filter = factory()
      // filters[name] = filter
      // return filter
    }
  }
  this.$get = ['$injector',function ($injector){
    return name=>$injector.get(name+'Filter')
  }]
  this.register('filter', filterFilter);
}
$FilterProvider.$inject = ['$provide'];
export {$FilterProvider}