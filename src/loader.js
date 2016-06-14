'use strict'
import {createInjector} from './injector'

let setupModuleLoader = window=>{
  let ensure = (obj, name, factory)=>{
    return obj[name]||(obj[name]=factory())
  }
  let angular = ensure(window,'angular',Object)
  let createModule = (name,requires,modules)=>{
    if (name==='hasOwnProperty') {
      throw 'hasOwnProperty is not a valid module name'
    };
    let invokeQueue = []
    let invokeLater = (method,arrMethod)=>{
      return (...args)=>{
        invokeQueue[arrMethod||'push']([method,args])
        // console.log(JSON.stringify(invokeQueue,null,2))
        return moduleInstance
      }
    }

    let moduleInstance = {
      name:name,
      requires:requires,
      constant:invokeLater('constant','unshift'),
      provider:invokeLater('provider'),
      _invokeQueue:invokeQueue
    }
    modules[name] = moduleInstance
    return moduleInstance
  }
  let getModule = (name,modules)=>{
    if (modules.hasOwnProperty(name)) {
      return modules[name]      
    }else{
      throw 'Module '+name+' is not exists'
    }
  }
  ensure(angular,'module',()=>{
    let modules = {}
    return (name,requires)=>{
      if (requires) {
        return createModule(name, requires,modules)
      }else{
        return getModule(name,modules)
      }
    }
  })
}

export {setupModuleLoader};
