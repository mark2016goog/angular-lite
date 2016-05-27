let Filter =require('./filter')
let filters = {}

let createPredicateFn = expression=>{
  return item=>{
    return item.toLowerCase().indexOf(expression.toLowerCase())>=0
  }
}

let filterFilter = ()=>{
  return (arr,filterExpr)=>{
    let fn
    if (_.isFunction(filterExpr)) {
      fn = filterExpr
    }else if(_.isString(filterExpr)){
      fn = createPredicateFn(filterExpr)
    }else{
      return arr
    }
    return _.filter(arr,fn)
  }
}

Filter.register('filter',filterFilter)

module.exports = filterFilter;