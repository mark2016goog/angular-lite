function setupModuleLoader (window) {
  function ensure (obj, name, factory) {
    return obj[name] || (obj[name] = factory())
  }
  const angular = ensure(window, 'angular', Object)
  function createModule (name, requires, modules, configFn) {
    if (name === 'hasOwnProperty') {
      throw 'hasOwnProperty is not a valid module name'
    }
    let invokeQueue = []
    let configBlocks = []
    function invokeLater (service, method, arrMethod, queue = invokeQueue) {
      return (...args) => {
        queue[arrMethod || 'push']([service, method, args])
        // console.log(JSON.stringify(invokeQueue,null,2))
        return moduleInstance
      }
    }

    let moduleInstance = {
      name: name,
      requires: requires,
      constant: invokeLater('$provide', 'constant', 'unshift'),
      provider: invokeLater('$provide', 'provider'),
      factory: invokeLater('$provide', 'factory'),
      service: invokeLater('$provide', 'service'),
      decorator: invokeLater('$provide', 'decorator'),
      value: invokeLater('$provide', 'value'),
      filter: invokeLater('$filterProvider', 'register'),
      config: invokeLater('$injector', 'invoke', 'push', configBlocks),
      run: function (fn) {
        moduleInstance._runBlocks.push(fn)
        return moduleInstance
      },
      _invokeQueue: invokeQueue,
      _configBlocks: configBlocks,
      _runBlocks: []
    }
    if (configFn) {
      moduleInstance.config(configFn)
    }

    modules[name] = moduleInstance
    return moduleInstance
  }
  function getModule (name, modules) {
    if (modules.hasOwnProperty(name)) {
      return modules[name]
    } else {
      throw 'Module ' + name + ' is not exists'
    }
  }
  ensure(angular, 'module', () => {
    let modules = {}
    return (name, requires, configFn) => {
      if (requires) {
        return createModule(name, requires, modules, configFn)
      } else {
        return getModule(name, modules)
      }
    }
  })
}

export { setupModuleLoader }
