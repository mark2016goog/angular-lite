let Filter =require('./filter')
let filters = {}

let comparator = (actual, expected)=>{
  console.log(actual, expected)
  actual = String(actual).toLowerCase()
  expected = String(expected).toLowerCase()
  return actual.indexOf(expected)>=0
}
let deepCompare = (actual, expected)=>{
  if (_.isObject(actual)) {
    return _.some(actual, value=>{
      return deepCompare(value, expected)
    })
  }else{
    return comparator(actual, expected)
  }
}
let createPredicateFn = expression=>{
  return item=>{
    return deepCompare(item, expression)
  }
}

let filterFilter = ()=>{
  return (arr,filterExpr)=>{
    let fn
    if (_.isFunction(filterExpr)) {
      fn = filterExpr
    }else if(_.isString(filterExpr)||
              _.isNumber(filterExpr)||
              _.isBoolean(filterExpr)){
      fn = createPredicateFn(filterExpr)
    }else{
      return arr
    }
    return _.filter(arr,fn)
  }
}

Filter.register('filter',filterFilter)

module.exports = filterFilter;