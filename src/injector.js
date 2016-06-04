'use strict'

let createInjector = (modulesToLoad)=>{
  let cache = {}
  let loadModules = {}
  let $provide = {
    constant(key,value){
      if (key==='hasOwnProperty') {
        throw 'hasOwnProperty is not a avalid constant name'
      };
      cache[key] = value
    }
  }
  let invoke = (fn)=>{
    let args = _.map(fn.$inject,token=>cache[token])
    return fn(...args)
  }

  _.forEach(modulesToLoad,function loadModule(moduleName){
    if (!loadModules[moduleName]) {
      loadModules[moduleName] = true    
      let module = angular.module(moduleName)
      _.forEach(module.requires, loadModule)
      _.forEach(module._invokeQueue,invokeArgs=>{
        let method=invokeArgs[0]
        let args=invokeArgs[1]
        $provide[method](...args)
      })
    };
  })
  return {
    has(key){
      return cache.hasOwnProperty(key)
    },
    get(key){
      return cache[key]
    },
    invoke:invoke
  }
}

export {createInjector}