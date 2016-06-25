// import {parse} from '../src/parse'
// import {register,filter} from '../src/filter'

import { publishExternalAPI} from '../src/angular_public'
import { createInjector} from '../src/injector'

let _ = require('lodash')
describe('Parse', () => {
  var parse
  beforeEach(function () {
    publishExternalAPI()
    parse = createInjector(['ng']).get('$parse')
  })

  describe('simple parse ', () => {

    it('可以处理一个整数', () => {
      let fn = parse('42')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42)
    })
    it('可以处理小数', () => {
      let fn = parse('4.2')
      expect(fn).toBeDefined()
      expect(fn()).toBe(4.2)
    })
    it('可以处理不带整数部分的小树', () => {
      let fn = parse('.42')
      expect(fn).toBeDefined()
      expect(fn()).toBe(0.42)
    })

    it('可以处理科学计数法', () => {
      let fn = parse('42e3')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42000)
    })
    it('可以处理不带整数的科学计数法', () => {
      let fn = parse('.42e2')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42)
    })
    it('可以处理科学计数法 e后面是负数', () => {
      let fn = parse('4200e-2')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42)
    })
    it('可以处理科学计数法 e后面是正数', () => {
      let fn = parse('.42e+2')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42)
    })
    it('可以处理科学计数法 大写的E也OK', () => {
      let fn = parse('.42E2')
      expect(fn).toBeDefined()
      expect(fn()).toBe(42)
    })
    it('不合法的数字报错', () => {
      expect(() => {
        parse('42e-')
      }).toThrow()
      expect(() => {
        parse('42e-a')
      }).toThrow()
    })

    it('可以处理单引号字符串', () => {
      let fn = parse("'abc'")
      expect(fn()).toBe('abc')
    })
    it('双引号字符串', () => {
      let fn = parse('"a-bc"')
      expect(fn()).toBe('a-bc')
    })
    it('字符串引号不匹配报错', () => {
      expect(() => {
        parse('"abc\'')
      }).toThrow()
    // expect(fn()).toBe('abc')
    })
    it('转义字符串', () => {
      let fn = parse("'a\\'b'")
      expect(fn()).toEqual("a'b")
    })
    it('转义字符串', () => {
      let fn = parse('"a\\"b"')
      expect(fn()).toEqual('a"b')
    })
    it('unicode不合法报错', () => {
      expect(() => {
        parse('"\\u00T0"')
      }).toThrow()
    })

    it('处理null', () => {
      let fn = parse('null')
      expect(fn()).toBe(null)
    })
    it('处理true', () => {
      let fn = parse('true')
      expect(fn()).toBe(true)
    })
    it('处理alse', () => {
      let fn = parse('false')
      expect(fn()).toBe(false)
    })
    it('忽略空格 tab 换行', () => {
      let fn = parse(' \n 42 ')
      expect(fn()).toBe(42)
    })
    it('处理空list', () => {
      let fn = parse('[]')
      expect(fn()).toEqual([])
    })
    it('处理非空数组', () => {
      let fn = parse('[1, "two", [3,4], true]')
      expect(fn()).toEqual([1, 'two', [3, 4], true])
    })

    it('处理空对象', () => {
      let fn = parse('{}')
      expect(fn()).toEqual({})
    })
    it('处理非空对象', () => {
      let fn = parse('{"name":"woniu",\'girlfriend\':"mushbroom"}')
      expect(fn()).toEqual({
        'name': 'woniu',
        'girlfriend': 'mushbroom'
      })
    })

    it('处理复杂对象 key带引号', () => {
      let fn = parse('{"a":1,"b":"2","c":[2,3],"d":{"e":4}}')
      expect(fn()).toEqual({
        a: 1,
        b: '2',
        c: [2, 3],
        d: {
          e: 4
        }
      })
    })
    it('处理复杂对象，key不带引号', () => {
      let fn = parse('{a:1,b:"2",c:[2,3],d:{e:4}}')
      expect(fn()).toEqual({
        a: 1,
        b: '2',
        c: [2, 3],
        d: {
          e: 4
        }
      })
    })
  })
  describe('处理变量和函数', () => {
    it('作用域里找变量', () => {
      let fn = parse('aKey')
    // expect(fn({aKey:42})).toBe(42)
    // expect(fn({})).toBeUndefined()
    })
    it('作用于里找不到就是Undefined', () => {
      let fn = parse('aKey')
      expect(fn()).toBeUndefined()
    })
    it('处理this', () => {
      let fn = parse('this')
      let scope = {}
      expect(fn(scope)).toBe(scope)
      expect(fn()).toBeUndefined()
    })
    it('处理a.b这种变量', () => {
      let fn = parse('aKey.bKey')
      // console.log(fn.toString())
      expect(fn({
        aKey: {
          bKey: 'woniu'
        }
      })).toBe('woniu')
      expect(fn({
        aKey: {}
      })).toBeUndefined()
      expect(fn()).toBeUndefined()
      expect(fn({})).toBeUndefined()
    })

    it('处理对象', () => {
      // console.log({aKey:42}.aKey)
      let fn = parse('{aKey:42}.aKey')
      expect(fn()).toBe(42)
    })

    it('处理a.b.c.d复杂表达式', () => {
      let fn = parse('aKey.bKey.cKey.dKey')
      // console.log(fn.toString())
      expect(fn({
        aKey: {
          bKey: {
            cKey: {
              dKey: 'woniu'
            }
          }
        }
      })).toBe('woniu')
      expect(fn({
        aKey: {
          bKey: {
            cKey: {}
          }
        }
      })).toBeUndefined()
      expect(fn({
        aKey: {
          bKey: {}
        }
      })).toBeUndefined()
      expect(fn({
        aKey: {}
      })).toBeUndefined()
      expect(fn()).toBeUndefined()
      expect(fn({})).toBeUndefined()
    })

    it('locals没有才找scope', () => {
      let fn = parse('aKey')
      let scope = {
        aKey: 'woniu'
      }
      let locals = {
        aKey: 'mushbroom'
      }
      expect(fn(scope, locals)).toBe('mushbroom')
    })
    it('locals了找不到就用scope的', () => {
      let fn = parse('aKey')
      let scope = {
        aKey: 'woniu'
      }
      let locals = {
        bKey: 'mushbroom'
      }
      expect(fn(scope, locals)).toBe('woniu')
    })
    it('第一个key在local里了，就没scope事了', () => {
      let fn = parse('aKey.bKey')
      let scope = {
        aKey: {
          bKey: 'woniu'
        }
      }
      let locals = {
        aKey: {}
      }
      expect(fn(scope, locals)).toBeUndefined()
    })
    it('a[”b“]也能找', () => {
      let fn = parse('aKey["bKey"]')
      expect(fn({
        aKey: {
          bKey: 'woniu'
        }
      })).toBe('woniu')
    })
    it('arr[1]也能处理', () => {
      let fn = parse('arr[1]')
      expect(fn({
        arr: [1, 2, 3]
      })).toBe(2)
    })
    it('parse a compute with another key as property', () => {
      let fn = parse('aKey[anotherKey]')
      expect(fn({
        anotherKey: 'bKey',
        aKey: {
          bKey: 'woniu'
        }
      })).toBe('woniu')
    })
    it('parse a compute with another key as property', () => {
      let fn = parse('aKey[anotherKey["cKey"]]')
      expect(fn({
        anotherKey: {
          cKey: 'mushbroom'
        },
        aKey: {
          'mushbroom': 'woniu'
        }
      })).toBe('woniu')
    })
    it('处理函数', () => {
      let fn = parse('aFunction()')
      // console.log(fn.toString())
      expect(fn({
        aFunction: () => 'woniu'
      })).toBe('woniu')
    })

    it('处理带一个参数的函数', () => {
      let fn = parse('aFunction(n)')
      expect(fn({
        aFunction: n => n,
        n: 42
      })).toBe(42)
    })
    it('处理带一个参数是函数的函数', () => {
      let fn = parse('aFunction(argFn())')
      expect(fn({
        argFn: n => 42,
        aFunction: arg => arg
      })).toBe(42)
    })
    it('处理多个参数的函数', () => {
      let fn = parse('aFunction(37,n,argFn())')
      expect(fn({
        n: 3,
        argFn: n => 42,
        aFunction: (a, b, c) => a + b + c
      })).toBe(82)
    })
    it('解析绑定在对象上的函数中的this ：a["fn"]()', () => {
      let scope = {
        obj: {
          aname: 'woniu',
          aFunction: function () {
            return this.aname
          }
        }
      }
      let fn = parse('obj["aFunction"]()')
      expect(fn(scope)).toBe('woniu')
    })
    it('解析绑定在对象上的函数中的this ：a.fn()', () => {
      let scope = {
        obj: {
          aname: 'woniu',
          aFunction: function () {
            return this.aname
          }
        }
      }
      let fn = parse('obj.aFunction()')
      expect(fn(scope)).toBe('woniu')
    })
    it('处理this就是scope', () => {
      let scope = {
        aFunction: function () {
          return this
        }
      }
      let fn = parse('aFunction()')
      // console.log(fn.toString())

      expect(fn(scope)).toBe(scope)
    })
    it('优先处理local上的函数', () => {
      let scope = {}
      let locals = {
        aFunction: function () {
          return this
        }
      }
      let fn = parse('aFunction()')
      expect(fn(scope, locals)).toBe(locals)
    })
    it('处理变量赋值', () => {
      let fn = parse('anAttribute="woniu"')
      let scope = {}
      fn(scope)
      expect(scope.anAttribute).toBe('woniu')
    })
    it('处理函数赋值', () => {
      let fn = parse('anAttribute=aFunction()')
      let scope = {
        aFunction: function () {
          return 'woniu'
        }
      }
      fn(scope)
      expect(scope.anAttribute).toBe('woniu')
    })
    it('处理对象复制a["b"]=c', () => {
      let fn = parse('obj["anAttribute"]="woniu"')
      let scope = {
        obj: {}
      }
      fn(scope)
      expect(scope.obj.anAttribute).toBe('woniu')
    })
    it('处理对象赋值a.b=c', () => {
      let fn = parse('obj.anAttribute="woniu"')
      let scope = {
        obj: {}
      }
      fn(scope)
      expect(scope.obj.anAttribute).toBe('woniu')
    })
    it('处理复杂的赋值a[0][b]=c这种', () => {
      let fn = parse('obj[0].anAttribute="woniu"')
      let scope = {
        obj: [{}, 'mushbroom']
      }
      fn(scope)
      expect(scope.obj[0].anAttribute).toBe('woniu')
      expect(scope.obj[1]).toBe('mushbroom')
    })
    it('赋值如果对象不存在，先设置一个空对象，防止出错', () => {
      let fn = parse('obj["anAttribute"].path="woniu"')
      // console.log(fn.toString())
      let scope = {}
      fn(scope)
      expect(scope.obj['anAttribute'].path).toBe('woniu')
    })
    it('处理一元操作符+', () => {
      expect(parse('+42')()).toBe(42)
      expect(parse('+a')({
        a: 42
      })).toBe(42)
    })
    it('+undefined替换成0', () => {
      // console.log(parse('+a').toString())
      expect(parse('+a')({})).toBe(0)
    })
    it('处理一元操作符!', () => {
      expect(parse('!true')()).toBe(false)
      expect(parse('!42')()).toBe(false)
      expect(parse('!a')({
        a: false
      })).toBe(true)
      expect(parse('!!a')({
        a: false
      })).toBe(false)
      expect(parse('!a')()).toBe(true)
    })
    it('处理一元操作符-', () => {
      expect(parse('-42')()).toBe(-42)
      expect(parse('-a')({
        a: 42
      })).toBe(-42)
      expect(parse('--a')({
        a: 42
      })).toBe(42)
      expect(parse('-a')({})).toBe(0)
    })
    it('处理！字符串', () => {
      expect(parse('"!"')()).toBe('!')
    })
    it('处理乘法', () => {
      expect(parse('2 * 4 ')()).toBe(8)
    })
    it('处理除法', () => {
      expect(parse('20 / 4 ')()).toBe(5)
    })
    it('处理求余', () => {
      expect(parse('20 % 8 ')()).toBe(4)
    })
    it('处理复杂的数学计算', () => {
      expect(parse('36 * 2 % 5')()).toBe(2)
    })
    it('处理加法', () => {
      expect(parse('2+2')()).toBe(4)
    })
    it('处理减法', () => {
      expect(parse('4-2')()).toBe(2)
    })
    it('复杂的加减乘数', () => {
      expect(parse('2 + 3 * 5')()).toBe(17)
      expect(parse('2 + 3 * 5 + 3')()).toBe(20)
    })
    it('处理><=', () => {
      expect(parse('2<3')()).toBe(true)
      expect(parse('3<2')()).toBe(false)
      expect(parse('1<=2')()).toBe(true)

      expect(parse('2<=2')()).toBe(true)
      expect(parse('1>=2')()).toBe(false)
      expect(parse('2>=2')()).toBe(true)
    })
    it('处理==,===,!==', () => {
      expect(parse('42==42')()).toBe(true)
      expect(parse('42=="42"')()).toBe(true)
      expect(parse('42!=42')()).toBe(false)
      expect(parse('42===42')()).toBe(true)
      expect(parse('42==="42"')()).toBe(false)
      expect(parse('42!==42')()).toBe(false)
    })
    it('多个判断', () => {
      expect(parse('2=="2" > 2 ==="2"')()).toBe(false)
    })
    it('多个判断', () => {
      expect(parse('2+3 < 6-2')()).toBe(false)
    })
    it('处理&&', () => {
      expect(parse('true && true')()).toBe(true)
      expect(parse('true && false')()).toBe(false)
      expect(parse('false && true')()).toBe(false)
      expect(parse('false && false')()).toBe(false)
    })
    it('处理||', () => {
      expect(parse('true || true')()).toBe(true)
      expect(parse('true || false')()).toBe(true)
      expect(parse('false || true')()).toBe(true)
      expect(parse('false || false')()).toBe(false)
    })
    it('处理多个&&', () => {
      expect(parse('true && true&& true')()).toBe(true)
      expect(parse('true && false&& true')()).toBe(false)
    })
    it('处理多个||', () => {
      expect(parse('true || true|| true')()).toBe(true)
      expect(parse('true || false|| true')()).toBe(true)
      expect(parse('false || false|| true')()).toBe(true)
      expect(parse('false || false|| false')()).toBe(false)
    })
    it('&&控制函数执行', () => {
      let invoked
      let scope = {
        fn: function () {
          invoked = true
        }
      }
      parse('false&&fn()')(scope)
      expect(invoked).toBeUndefined()
    })
    it('||控制函数执行', () => {
      let invoked
      let scope = {
        fn: function () {
          invoked = true
        }
      }
      parse('true||fn()')(scope)
      expect(invoked).toBeUndefined()
    })
    it('&&优先级比||高', () => {
      expect(parse('false &&true|| true')()).toBe(true)
    })
    it('||优先级比===低', () => {
      expect(parse('1===2||2===2')()).toBeTruthy()
    })
    it('三元表达式', () => {
      // console.log(parse('a===42?true:false').toString())
      expect(parse('a===42?true:false')({
        a: 42
      })).toBe(true)
      expect(parse('a===42?true:false')({
        a: 43
      })).toBe(false)
    })
    it('or比三元表达式优先级高', () => {
      expect(parse('0||1?0||2:0||3')()).toBe(2)
    })
    it('处理带括号的表达式', () => {
      expect(parse('21*(3 - 1)')()).toBe(42)
      expect(parse('false &&(true || true)')()).toBe(false)
      expect(parse('-((a%2===0)?1:2)')({
        a: 42
      })).toBe(-1)
    })
    it('解析多条语句', () => {
      let fn = parse('a=1;b=2;c=3;')
      let scope = {}
      fn(scope)
      expect(scope).toEqual({
        a: 1,
        b: 2,
        c: 3
      })
    })
    it('多条语句，最后是返回值', () => {
      expect(parse('a=1;b=2;a+b')({})).toBe(3)
    })

    it('can parse filter expressions', function () {
      parse = createInjector(['ng', function ($filterProvider) {
        $filterProvider.register('upcase', function () {
          return function (str) {
            return str.toUpperCase()
          }
        })
      }]).get('$parse')
      var fn = parse('aString | upcase')
      expect(fn({aString: 'Hello'})).toEqual('HELLO')
    })

    it('can parse filter chain expressions', function () {
      parse = createInjector(['ng', function ($filterProvider) {
        $filterProvider.register('upcase', function () {
          return function (s) {
            return s.toUpperCase()
          }
        })
        $filterProvider.register('exclamate', function () {
          return function (s) {
            return s + '!'
          }
        })
      }]).get('$parse')
      var fn = parse('"hello" | upcase | exclamate')
      expect(fn()).toEqual('HELLO!')
    })

    it('can pass an additional argument to filters', function () {
      parse = createInjector(['ng', function ($filterProvider) {
        $filterProvider.register('repeat', function () {
          return function (s, times) {
            return _.repeat(s, times)
          }
        })
      }]).get('$parse')
      var fn = parse('"hello" | repeat:3')
      expect(fn()).toEqual('hellohellohello')
    })

    it('can pass several additional arguments to filters', function () {
      parse = createInjector(['ng', function ($filterProvider) {
        $filterProvider.register('surround', function () {
          return function (s, left, right) {
            return left + s + right
          }
        })
      }]).get('$parse')
      var fn = parse('"hello" | surround:"*":"!"')
      expect(fn()).toEqual('*hello!')
    })
  })

  describe('结合parse和scope', () => {
    it('函数返回自己', () => {
      let fn = () => {
      }
      expect(parse(fn)).toBe(fn)
    })
    it('没参数也返回一个函数', () => {
      // let fn = ()=>{}
      expect(parse()).toEqual(jasmine.any(Function))
    })
    it('数字解析是literal', function () {
      var fn = parse('42')
      expect(fn.literal).toBe(true)
    })
    it('字符串也是literal', function () {
      var fn = parse('"abc"')
      expect(fn.literal).toBe(true)
    })
    it('布尔也是literal', function () {
      var fn = parse('true')
      expect(fn.literal).toBe(true)
    })
    it('数字也是literal', function () {
      var fn = parse('[1, 2, aVariable]')
      expect(fn.literal).toBe(true)
    })
    it('对象也是literal', function () {
      var fn = parse('{a: 1, b: aVariable}')
      expect(fn.literal).toBe(true)
    })
    it('表达式就不是literal了', function () {
      var fn = parse('!false')
      expect(fn.literal).toBe(false)
    })
    it('运算表达式也不是literal了', function () {
      var fn = parse('1 + 2')
      expect(fn.literal).toBe(false)
    })

    it('整数是 constant', function () {
      var fn = parse('42')
      expect(fn.constant).toBe(true)
    })
    it('字符串是constant', function () {
      var fn = parse('"abc"')
      expect(fn.constant).toBe(true)
    })
    it('布尔是constant', function () {
      var fn = parse('true')
      expect(fn.constant).toBe(true)
    })

    it('变量不是constant', function () {
      var fn = parse('a')
      expect(fn.constant).toBe(false)
    })
    it('带变量的数组不是constant,都是常量的是', function () {
      expect(parse('[1, 2, 3]').constant).toBe(true)
      expect(parse('[1, [2, [3]]]').constant).toBe(true)
      expect(parse('[1, 2, a]').constant).toBe(false)
      expect(parse('[1, [2, [a]]]').constant).toBe(false)
    })
    it('和数组逻辑类似', function () {
      expect(parse('{a: 1, b: 2}').constant).toBe(true)
      expect(parse('{a: 1, b: {c: 3}}').constant).toBe(true)
      expect(parse('{a: 1, b: something}').constant).toBe(false)
      expect(parse('{a: 1, b: {c: something}}').constant).toBe(false)
    })

    it('this不是constant', function () {
      var fn = parse('this')
      expect(fn.constant).toBe(false)
    })
    it('对象自己计算结果是constant', function () {
      expect(parse('{a: 1}.a').constant).toBe(true)
      expect(parse('obj.a').constant).toBe(false)
    })
    it('继续测试对象的constant。用中括号能找到，也是constant', function () {
      expect(parse('{a: 1}["a"]').constant).toBe(true)
      expect(parse('obj["a"]').constant).toBe(false)
      expect(parse('{a: 1}[something]').constant).toBe(false)
      expect(parse('obj[something]').constant).toBe(false)
    })

    it('函数不是 constant', function () {
      expect(parse('aFunction()').constant).toBe(false)
    })

    it('过滤器看参数，是不是constant', function () {
      parse = createInjector(['ng', function ($filterProvider) {
        $filterProvider.register('aFilter', function () {
          return _.identity
        })
      }]).get('$parse')
      expect(parse('[1, 2, 3] | aFilter').constant).toBe(true)
      expect(parse('[1, 2, a] | aFilter').constant).toBe(false)
      expect(parse('[1, 2, 3] | aFilter:42').constant).toBe(true)
      expect(parse('[1, 2, 3] | aFilter:a').constant).toBe(false)
    })
    it('赋值操作必须两边都是constant', function () {
      expect(parse('1 = 2').constant).toBe(true)
      expect(parse('a = 2').constant).toBe(false)
      expect(parse('1 = b').constant).toBe(false)
      expect(parse('a = b').constant).toBe(false)
    })

    it('constant的+一元操作符还是constant', function () {
      expect(parse('+42').constant).toBe(true)
      expect(parse('+a').constant).toBe(false)
    })

    it('加法两次都是constant才是constant', function () {
      expect(parse('1 + 2').constant).toBe(true)
      expect(parse('1 + 2').literal).toBe(false)
      expect(parse('1 + a').constant).toBe(false)
      expect(parse('a + 1').constant).toBe(false)
      expect(parse('a + a').constant).toBe(false)
    })
    it('&& 两边都是constant', function () {
      expect(parse('true && false').constant).toBe(true)
      expect(parse('true && false').literal).toBe(false)
      expect(parse('true && a').constant).toBe(false)
      expect(parse('a && false').constant).toBe(false)
      expect(parse('a && b').constant).toBe(false)
    })
  })
})
