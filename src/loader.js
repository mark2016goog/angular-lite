'use strict'

let setupModuleLoader = window=>{
  let ensure = (obj, name, factory)=>{
    return obj[name]||(obj[name]=factory())
  }
  let angular = ensure(window,'angular',Object)
  let createModule = (name,requires,modules)=>{
    if (name==='hasOwnProperty') {
      throw 'hasOwnProperty is not a valid module name'
    };
    let moduleInstance = {
      name:name,
      requires:requires
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
