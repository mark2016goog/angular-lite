let filters = {}

let register = (name, factory)=>{
  if (_.isObject(name)) {
    return _.map(name,(factory, name)=>{
      return register(name,factory)
    })
  }else{
    let filter = factory()
    filters[name] = filter
    return filter
  }
}
let filter = name=>{
  return filters[name]
}

module.exports = {register,filter}