const FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
const INSTANTIATING = {}
function createInjector (modulesToLoad) {
  const instanceCache = {}
  const providerCache = {}
  const loadModules = new Map()
  providerCache.$provide = {
    constant(key, value) {
      if (key === 'hasOwnProperty') {
        throw 'hasOwnProperty is not a avalid constant name'
      }
      instanceCache[key] = value
      providerCache[key] = value
    },
    provider(key, proObj) {
      if (_.isFunction(proObj)) {
        proObj = providerInjector.instantiate(proObj)
      }
      providerCache[key + 'Provider'] = proObj
    },
    factory(key, factoryFn) {
      this.provider(key, {
        $get: factoryFn
      })
    },
    service(key, consturtor) {
      this.factory(key, () => {
        return instanceInjector.instantiate(consturtor)
      })
    },
    value(key, val) {
      this.factory(key, () => val)
    },
    decorator(serviceName, decoratorFn) {
      const provider = providerInjector.get(serviceName + 'Provider')
      const originGet = provider.$get
      provider.$get = () => {
        const instance = instanceInjector.invoke(originGet, provider)
        instanceInjector.invoke(decoratorFn, null, { '$delegate': instance })
        return instance
      }
    }
  }
  const providerInjector = providerCache.$injector = createInternalInjector(providerCache, name => {
    throw 'unknow provider ' + name
  })
  const instanceInjector = instanceCache.$injector = createInternalInjector(instanceCache, name => {
    var provider = providerInjector.get(name + 'Provider')
    return instanceInjector.invoke(provider.$get, provider)
  })

  function createInternalInjector (cache, factoryFn) {
    const getService = name => {
      if (cache.hasOwnProperty(name)) {
        if (cache[name] === INSTANTIATING) {
          throw new Error('Circular dependency found')
        }
        return cache[name]
      } else {
        // 找a的时候，需要加上Provier后缀找，并且执行
        cache[name] = INSTANTIATING
        try {
          return (cache[name] = factoryFn(name))
        } finally {
          if (cache[name] === INSTANTIATING) {
            delete cache[name]
          }
        }

      // let provider = providerCache[name+'Provider']
      // let instance = cache[name]=invoke(provider.$get)
      // // return invoke(provider.$get,provider)
      // return instance
      }
    }

    function invoke (fn, self, locals) {
      const args = _.map(annotate(fn), token => {
        if (_.isString(token)) {
          return locals && locals.hasOwnProperty(token) ? locals[token] : getService(token)
        } else {
          throw 'token expected a string!'
        }
      })
      if (_.isArray(fn)) {
        fn = _.last(fn)
      }
      return fn.apply(self, args)

    // return self::fn(...args)
    }

    function instantiate (Type, locals) {
      var UnwrappedType = _.isArray(Type) ? _.last(Type) : Type
      var instance = Object.create(UnwrappedType.prototype)
      invoke(Type, instance, locals)
      return instance
    }

    function annotate (fn) {
      // console.log(fn)
      if (_.isArray(fn)) {
        return _.initial(fn)
      } else if (fn.$inject) {
        return fn.$inject
      } else if (!fn.length) {
        return []
      } else {
        var argDeclaration = fn.toString().match(FN_ARGS)
        return argDeclaration[1].replace(' ', '').split(',')
      }
    }
    return {
      has(key) {
        return cache.hasOwnProperty(key) || providerCache.hasOwnProperty(key + 'Provider')
      },
      get: getService,
      invoke: invoke,
      annotate: annotate,
      instantiate: instantiate
    }
  }

  function runInvokeQueue (queue) {
    _.forEach(queue, invokeArgs => {
      const service = providerInjector.get(invokeArgs[0])
      const method = invokeArgs[1]
      const args = invokeArgs[2]
      service[method].apply(service, args)
    })
  }
  let runBlocks = []
  _.forEach(modulesToLoad, function loadModule (moduleName) {
    if (!loadModules.get(moduleName)) {
      loadModules.set(moduleName, true)
      if (_.isString(moduleName)) {
        const module = angular.module(moduleName)
        _.forEach(module.requires, loadModule)
        runInvokeQueue(module._invokeQueue)
        runInvokeQueue(module._configBlocks)
        runBlocks = runBlocks.concat(module._runBlocks)
      } else if (_.isFunction(moduleName) || _.isArray(moduleName)) {
        const res = providerInjector.invoke(moduleName)
        res && runBlocks.push(res)
      }
    }
  })
  _.forEach(runBlocks, runBlock => {
    instanceInjector.invoke(runBlock)
  })

  return instanceInjector
}

export { createInjector }
