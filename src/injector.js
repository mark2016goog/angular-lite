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
  let annotate = fn => {
    if (_.isArray(fn)) {
      return _.initial(fn)
    }else if(fn.$inject){
      return fn.$inject

    }else{
      return []
    }
  }
  let invoke = (fn, self, locals) => {
    let args = _.map(fn.$inject, token => {
      if (_.isString(token)) {
        return locals&&locals.hasOwnProperty(token)?
                  locals[token]:
                  cache[token]

      } else {
        throw 'token expected a string!'
      }

    })
    return self::fn(...args)

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
    invoke:invoke,
    annotate:annotate
  }
}

export {createInjector}