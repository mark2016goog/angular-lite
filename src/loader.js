'use strict'
import {createInjector} from './injector'

let setupModuleLoader = window=>{
  function ensure(obj, name, factory){
    return obj[name]||(obj[name]=factory())
  }
  let angular = ensure(window,'angular',Object)
  function createModule(name,requires,modules,configFn){
    if (name==='hasOwnProperty') {
      throw 'hasOwnProperty is not a valid module name'
    };
    let invokeQueue = []
    let configBlocks = []
    function invokeLater(service, method,arrMethod,queue=invokeQueue){
      return (...args)=>{
        queue[arrMethod||'push']([service, method,args])
        // console.log(JSON.stringify(invokeQueue,null,2))
        return moduleInstance
      }
    }

    let moduleInstance = {
      name:name,
      requires:requires,
      constant:invokeLater('$provide','constant','unshift'),
      provider:invokeLater('$provide','provider'),
      factory:invokeLater('$provide','factory'),
      value:invokeLater('$provide','value'),
      config:invokeLater('$injector','invoke','push',configBlocks),
      run:function(fn){
        moduleInstance._runBlocks.push(fn)
        return moduleInstance
      },
      _invokeQueue:invokeQueue,
      _configBlocks:configBlocks,
      _runBlocks:[]
    }
    if (configFn) {
      moduleInstance.config(configFn)
    };

    modules[name] = moduleInstance
    return moduleInstance
  }
  function getModule(name,modules){
    if (modules.hasOwnProperty(name)) {
      return modules[name]      
    }else{
      throw 'Module '+name+' is not exists'
    }
  }
  ensure(angular,'module',()=>{
    let modules = {}
    return (name,requires, configFn)=>{
      if (requires) {
        return createModule(name, requires,modules,configFn)
      }else{
        return getModule(name,modules)
      }
    }
  })
}

export {setupModuleLoader};
