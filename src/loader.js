'use strict'

let setupModuleLoader = window=>{
  let ensure = (obj, name, factory)=>{
    return obj[name]||(obj[name]=factory())
  }
  let angular = ensure(window,'angular',Object)
  ensure(angular,'module',()=>{
    return ()=>{
      
    }
  })
}

export {setupModuleLoader};
