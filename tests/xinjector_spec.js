'use strict'

import {
  setupModuleLoader
} from '../src/loader'
import {
  createInjector
} from '../src/injector'
describe('测试injector', () => {
  beforeEach(function() {
    delete window.angular;
    setupModuleLoader(window)
  });

  it('创建注入器', function() {
    var injector = createInjector([]);
    expect(injector).toBeDefined();
  });
  it('constant函数注册一个常量', function() {
    var module = angular.module('myModule', []);
    module.constant('aConstant', 42);
    // console.log(JSON.stringify(module,null,2))
    var injector = createInjector(['myModule']);
    expect(injector.has('aConstant')).toBe(true);
  });
  it('没注册的constant返回false', function() {
    var module = angular.module('myModule', []);
    var injector = createInjector(['myModule']);
    expect(injector.has('aConstant')).toBe(false);
  });
  it('常量名不能是hasOwnProperty', function() {
    var module = angular.module('myModule', []);
    module.constant('hasOwnProperty', _.constant(false));
    expect(function() {
      createInjector(['myModule']);
    }).toThrow();
  });
  it('可以用get获取constant的值', function() {
    var module = angular.module('myModule', []);
    module.constant('aConstant', 42);
    var injector = createInjector(['myModule']);
    expect(injector.get('aConstant')).toBe(42);
  });
  it('注入多个依赖', function() {
    var module1 = angular.module('myModule', []);
    var module2 = angular.module('myOtherModule', []);
    module1.constant('aConstant', 42);
    module2.constant('anotherConstant', 43);
    var injector = createInjector(['myModule', 'myOtherModule']);
    expect(injector.has('aConstant')).toBe(true);
    expect(injector.has('anotherConstant')).toBe(true);
  });
  it('module第二个参数，支持注入依赖', function() {
    var module1 = angular.module('myModule', []);
    var module2 = angular.module('myOtherModule', ['myModule']);
    module1.constant('aConstant', 42);
    module2.constant('anotherConstant', 43);
    var injector = createInjector(['myOtherModule']);
    expect(injector.has('aConstant')).toBe(true);
    expect(injector.has('anotherConstant')).toBe(true);
  });
  it('注入多个', function() {
    var module1 = angular.module('myModule', []);
    var module2 = angular.module('myOtherModule', ['myModule']);
    var module3 = angular.module('myThirdModule', ['myOtherModule']);
    module1.constant('aConstant', 42);
    module2.constant('anotherConstant', 43);
    module3.constant('aThirdConstant', 44);
    var injector = createInjector(['myThirdModule']);
    expect(injector.has('aConstant')).toBe(true);
    expect(injector.has('anotherConstant')).toBe(true);
    expect(injector.has('aThirdConstant')).toBe(true);
  });

  it('模块只注入加载一次', function() {
    angular.module('myModule', ['myOtherModule']);
    angular.module('myOtherModule', ['myModule']);
    createInjector(['myModule']);


  });

  it('$injector属性，和annotate', function() {
    var module = angular.module('myModule', []);
    module.constant('a', 1);
    module.constant('b', 2);
    var injector = createInjector(['myModule']);
    var fn = function(one, two) {
      return one + two;
    };
    fn.$inject = ['a', 'b'];
    expect(injector.invoke(fn)).toBe(3);
  });
  it('注入数字会报错', function() {
    var module = angular.module('myModule', []);
    module.constant('a', 1);
    var injector = createInjector(['myModule']);
    var fn = function(one, two) {
      return one + two;
    };
    fn.$inject = ['a', 2];
    expect(function() {
      injector.invoke(fn);
    }).toThrow();
  });

  it('保持上下文', function() {
    var module = angular.module('myModule', []);
    module.constant('a', 1);
    var injector = createInjector(['myModule']);
    var obj = {
      two: 2,
      fn: function(one) {
        return one + this.two;
      }
    };
    obj.fn.$inject = ['a'];
    expect(injector.invoke(obj.fn, obj)).toBe(3);
  });

  it('invoke第三个参数，会覆盖掉依赖注入', function() {
    var module = angular.module('myModule', []);
    module.constant('a', 1);
    module.constant('b', 2);
    var injector = createInjector(['myModule']);
    var fn = function(one, two) {
      return one + two;
    };
    fn.$inject = ['a', 'b'];
    expect(injector.invoke(fn, undefined, {
      b: 3
    })).toBe(4);
  });

  describe('annotate', function() {
    it('annotate函数获取依赖注入', function() {
      var injector = createInjector([]);
      var fn = function() {};
      fn.$inject = ['a', 'b'];
      expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });
    it('annotate形式写法', function() {
      var injector = createInjector([]);
      var fn = ['a', 'b', function() {}];
      expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });

    it('函数没有参数，注入就是空数组', function() {
      var injector = createInjector([]);
      var fn = function() {};
      expect(injector.annotate(fn)).toEqual([]);
    });
    it('能从参数里解析出依赖', function() {
      var injector = createInjector([]);
      var fn = function(a, b) {};
      expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });
    it('数组annotate', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);
      var fn = ['a', 'b', function(one, two) {
        return one + two;
      }];
      expect(injector.invoke(fn)).toBe(3);
    });
    it('invokes a non-annotated function with dependency injection', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);
      var fn = function(a, b) {
        return a + b;
      };
      expect(injector.invoke(fn)).toBe(3);
    });
    it('instantiates an annotated constructor function', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(one, two) {
        this.result = one + two;
      }
      Type.$inject = ['a', 'b'];
      var instance = injector.instantiate(Type);
      expect(instance.result).toBe(3);
    });

    it('instantiates an array-annotated constructor function', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(one, two) {
        this.result = one + two;
      }
      var instance = injector.instantiate(['a', 'b', Type]);
      expect(instance.result).toBe(3);
    });
    it('instantiates a non-annotated constructor function', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(a, b) {
        this.result = a + b;
      }
      var instance = injector.instantiate(Type);
      expect(instance.result).toBe(3);
    });
  });
  describe('provider', () => {
    it('provicer方法要有一个$get方法', function() {
      var module = angular.module('myModule', []);
      module.provider('a', {
        $get: function() {
          return 42;
        }
      });
      // module.constant('a',42)
      var injector = createInjector(['myModule']);
      expect(injector.has('a')).toBe(true);
      expect(injector.get('a')).toBe(42);
    });
    it('injects the $get method of a provider', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 1);
      module.provider('b', {
        $get: function(a) {
          return a + 2;
        }
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('b')).toBe(3);
    });

    it('$get懒执行', function() {
      var module = angular.module('myModule', []);
      module.provider('b', {
        $get: function(a) {
          return a + 2;
        }
      });
      module.provider('a', {
        $get: _.constant(1)
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('b')).toBe(3);
    });
    it('依赖只会被实例化一次', function() {
      var module = angular.module('myModule', []);
      module.provider('a', {
        $get: function() {
          return {};
        }
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(injector.get('a'));
    });
    it('不允许循环依赖', function() {
      var module = angular.module('myModule', []);
      module.provider('a', {
        $get: function(b) {}
      });
      module.provider('b', {
        $get: function(c) {}
      });
      module.provider('c', {
        $get: function(a) {}
      });
      var injector = createInjector(['myModule']);
      expect(function() {
        injector.get('a');
      }).toThrowError(/Circular dependency found/);
    });
    it('instantiates a provider if given as a constructor function', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function() {
          return 42;
        };
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('injects the given provider constructor function', function() {
      var module = angular.module('myModule', []);
      module.constant('b', 2);
      module.provider('a', function AProvider(b) {
        this.$get = function() {
          return 1 + b;
        };
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(3);
    });
    it('provider可配置', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        var value = 1;
        this.setValue = function(v) {
          value = v;
        };
        this.$get = function() {
          return value;
        };
      });
      module.provider('b', function BProvider(aProvider) {
        aProvider.setValue(2);
        this.$get = function() {};
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(2);
    });
    it('does not inject an instance to a provider constructor function', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function() {
          return 1;
        };
      });
      module.provider('b', function BProvider(a) {
        this.$get = function() {
          return a;
        };
      });
      expect(function() {
        createInjector(['myModule']);
      }).toThrow();
    });
    it('does not inject a provider to a $get function', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function() {
          return 1;
        };
      });
      module.provider('b', function BProvider() {
        this.$get = function(aProvider) {
          return aProvider.$get();
        };
      });
      var injector = createInjector(['myModule']);
      expect(function() {
        injector.get('b');
      }).toThrow();
    });
    it('does not inject a provider to invoke', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function() {
          return 1;
        }
      });
      var injector = createInjector(['myModule']);
      expect(function() {
        injector.invoke(function(aProvider) {});
      }).toThrow();
    });
    it('does not give access to providers through get', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function() {
          return 1;
        };
      });
      var injector = createInjector(['myModule']);
      expect(function() {
        injector.get('aProvider');
      }).toThrow();
    });
    it('优先实例化constant', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider(b) {
        this.$get = function() {
          return b;
        };
      });
      module.constant('b', 42);
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('允许￥get里注入$injector', function() {
      var module = angular.module('myModule', []);
      module.constant('a', 42);
      module.provider('b', function BProvider() {
        this.$get = function($injector) {
          return $injector.get('a');
        };
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('b')).toBe(42);
    });
    it('允许在provider里注入$injector', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.value = 42;
        this.$get = function() {
          return this.value;
        };
      });
      module.provider('b', function BProvider($injector) {
        var aProvider = $injector.get('aProvider');
        this.$get = function() {
          return aProvider.value;
        };
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('b')).toBe(42);
    });
    it('allows injecting the $provide service to providers', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider($provide) {
        $provide.constant('b', 2);
        this.$get = function(b) {
          return 1 + b;
        };
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(3);
    });
    it('does not allow injecting the $provide service to $get', function() {
      var module = angular.module('myModule', []);
      module.provider('a', function AProvider() {
        this.$get = function($provide) {};
      });
      var injector = createInjector(['myModule']);
      expect(function() {
        injector.get('a');
      }).toThrow();
    });
    it('创建injector的时候就执行config', function() {
      var module = angular.module('myModule', []);
      var hasRun = false;
      module.config(function() {
        hasRun = true;
      });
      createInjector(['myModule']);
      expect(hasRun).toBe(true);
    });
    it('injects config blocks with provider injector', function() {
      var module = angular.module('myModule', []);
      module.config(function($provide) {
        $provide.constant('a', 42);
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('allows registering config blocks before providers', function() {
      var module = angular.module('myModule', []);
      module.config(function(aProvider) {});
      module.provider('a', function() {
        this.$get = _.constant(42);
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('runs a config block added during module registration', function() {
      var module = angular.module('myModule', [], function($provide) {
        $provide.constant('a', 42);
      });
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });

  })
  describe('run block', () => {
    it('runs run blocks when the injector is created', function() {
      var module = angular.module('myModule', []);
      var hasRun = false;
      module.run(function() {
        hasRun = true;
      });
      createInjector(['myModule']);
      expect(hasRun).toBe(true);
    });
    it('injects run blocks with the instance injector', function() {
      var module = angular.module('myModule', []);
      module.provider('a', {
        $get: _.constant(42)
      });
      var gotA;
      module.run(function(a) {
        gotA = a;
      });
      createInjector(['myModule']);
      expect(gotA).toBe(42);
    });
    it('configures all modules before running any run blocks', function() {
      var module1 = angular.module('myModule', []);
      module1.provider('a', {
        $get: _.constant(1)
      });
      var result;
      module1.run(function(a, b) {
        result = a + b;
      });
      var module2 = angular.module('myOtherModule', []);
      module2.provider('b', {
        $get: _.constant(2)
      });
      createInjector(['myModule', 'myOtherModule']);
      expect(result).toBe(3);
    });


  })
  describe('modules依赖', () => {
    it('runs a function module dependency as a config block', function() {
      var functionModule = function($provide) {
        $provide.constant('a', 42);
      };
      angular.module('myModule', [functionModule]);
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('runs a function module with array injection as a config block', function() {
      var functionModule = ['$provide', function($provide) {
        $provide.constant('a', 42);
      }];
      angular.module('myModule', [functionModule]);
      var injector = createInjector(['myModule']);
      expect(injector.get('a')).toBe(42);
    });
    it('supports returning a run block from a function module', function() {
      var result;
      var functionModule = function($provide) {
        $provide.constant('a', 42);
        return function(a) {
          result = a;
        };
      };
      angular.module('myModule', [functionModule]);
      createInjector(['myModule']);
      expect(result).toBe(42);
    });
xit('only loads function modules once', function() {
var loadedTimes = 0;
var functionModule = function() {
loadedTimes++;
};
angular.module('myModule', [functionModule, functionModule]);
createInjector(['myModule']);
expect(loadedTimes).toBe(1);
});












  })

})