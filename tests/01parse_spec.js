let parse = require('../src/parse')
let _ = require('lodash')
describe('Parse', () => {
describe('simple parse ',()=>{

  it('可以处理一个整数',()=>{
    let fn = parse('42')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('可以处理小数',()=>{
    let fn = parse('4.2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(4.2)
  })
  it('可以处理不带整数部分的小树',()=>{
    let fn = parse('.42')
    expect(fn).toBeDefined()
    expect(fn()).toBe(0.42)
  })

  it('可以处理科学计数法',()=>{
    let fn = parse('42e3')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42000)
  })
  it('可以处理不带整数的科学计数法',()=>{
    let fn = parse('.42e2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('可以处理科学计数法 e后面是负数',()=>{
    let fn = parse('4200e-2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('可以处理科学计数法 e后面是正数',()=>{
    let fn = parse('.42e+2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('可以处理科学计数法 大写的E也OK',()=>{
    let fn = parse('.42E2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('不合法的数字报错',()=>{
    expect(()=>{parse('42e-')}).toThrow()
    expect(()=>{parse('42e-a')}).toThrow()
  })

  it('可以处理单引号字符串',()=>{
    let fn = parse("'abc'")
    expect(fn()).toBe('abc')
  })
  it('双引号字符串',()=>{
    let fn = parse('"a-bc"')
    expect(fn()).toBe('a-bc')
  })
  it('字符串引号不匹配报错',()=>{
    expect(()=>{ parse('"abc\'') }).toThrow()
    // expect(fn()).toBe('abc')
  })
  it('转义字符串',()=>{
    let fn = parse("'a\\\'b'")
    expect(fn()).toEqual('a\'b')
  })
  it('转义字符串',()=>{
    let fn = parse('"a\\\"b"')
    expect(fn()).toEqual('a\"b')
  })
  it('unicode不合法报错',()=>{
    expect(()=>{parse('"\\u00T0"')}).toThrow()
  })

  it('处理null',()=>{
    let fn = parse("null")
    expect(fn()).toBe(null)
  })
  it('处理true',()=>{
    let fn = parse("true")
    expect(fn()).toBe(true)
  })
  it('处理alse',()=>{
    let fn = parse("false")
    expect(fn()).toBe(false)
  })
  it('忽略空格 tab 换行',()=>{
    let fn = parse(' \n 42 ')
    expect(fn()).toBe(42)
  })
  it('处理空list',()=>{
    let fn = parse('[]')
    expect(fn()).toEqual([])
  })
  it('处理非空数组',()=>{
    let fn = parse('[1, "two", [3,4], true]')
    expect(fn()).toEqual([1, "two", [3,4], true])
  })


  it('处理空对象',()=>{
    let fn = parse('{}')
    expect(fn()).toEqual({})
  })
  it('处理非空对象',()=>{
    let fn = parse('{"name":"woniu",\'girlfriend\':"mushbroom"}')
    expect(fn()).toEqual({"name":"woniu",'girlfriend':"mushbroom"})
  })

  it('处理复杂对象 key带引号',()=>{
    let fn = parse('{"a":1,"b":"2","c":[2,3],"d":{"e":4}}')
    expect(fn()).toEqual({a:1,b:"2",c:[2,3],d:{e:4}})
  })
  it('处理复杂对象，key不带引号',()=>{
    let fn = parse('{a:1,b:"2",c:[2,3],d:{e:4}}')
    expect(fn()).toEqual({a:1,b:"2",c:[2,3],d:{e:4}})
  })

})
describe('处理变量和函数',()=>{
  it('作用域里找变量',()=>{
    let fn = parse('aKey')
    // expect(fn({aKey:42})).toBe(42)
    // expect(fn({})).toBeUndefined()
  })
  it('作用于里找不到就是Undefined',()=>{
    let fn = parse('aKey')
    expect(fn()).toBeUndefined()
  })
  it('处理this',()=>{
    let fn = parse('this')
    let scope = {}
    expect(fn(scope)).toBe(scope)
    expect(fn()).toBeUndefined()
  })
  it('处理a.b这种变量',()=>{
    let fn = parse('aKey.bKey')
    // console.log(fn.toString())
    expect(fn({aKey:{bKey:'woniu'}})).toBe('woniu')
    expect(fn({aKey:{}})).toBeUndefined()
    expect(fn()).toBeUndefined()
    expect(fn({})).toBeUndefined()
  })

  it('处理对象',()=>{
    // console.log({aKey:42}.aKey)
    let fn = parse('{aKey:42}.aKey')
    expect(fn()).toBe(42)
  })

  it('处理a.b.c.d复杂表达式',()=>{
    let fn = parse('aKey.bKey.cKey.dKey')
    // console.log(fn.toString())
    expect(fn({aKey:{bKey:{cKey:{dKey:'woniu'}}}})).toBe('woniu')
    expect(fn({aKey:{bKey:{cKey:{}}}})).toBeUndefined()
    expect(fn({aKey:{bKey:{}}})).toBeUndefined()
    expect(fn({aKey:{}})).toBeUndefined()
    expect(fn()).toBeUndefined()
    expect(fn({})).toBeUndefined()
  })

  it('locals没有才找scope',()=>{
    let fn = parse('aKey')
    let scope = {aKey:'woniu'}
    let locals = {aKey:'mushbroom'}
    expect(fn(scope,locals)).toBe('mushbroom')
  })
  it('locals了找不到就用scope的',()=>{
    let fn = parse('aKey')
    let scope = {aKey:'woniu'}
    let locals = {bKey:'mushbroom'}
    expect(fn(scope,locals)).toBe('woniu')
  })
  it('第一个key在local里了，就没scope事了',()=>{
    let fn = parse('aKey.bKey')
    let scope = {aKey:{bKey:'woniu'}}
    let locals = {aKey:{}}
    expect(fn(scope,locals)).toBeUndefined()
  })
  it('a[”b“]也能找',()=>{
    let fn = parse('aKey["bKey"]')
    expect(fn({aKey:{bKey:'woniu'}})).toBe('woniu')
  })
  it('arr[1]也能处理',()=>{
    let fn = parse('arr[1]')
    expect(fn({arr:[1,2,3]})).toBe(2)
  })
  it('parse a compute with another key as property',()=>{
    let fn = parse('aKey[anotherKey]')
    expect(fn({anotherKey:'bKey',aKey:{bKey:'woniu'}})).toBe('woniu')
  })
  it('parse a compute with another key as property',()=>{
    let fn = parse('aKey[anotherKey["cKey"]]')
    expect(fn({anotherKey:{cKey:'mushbroom'},aKey:{'mushbroom':'woniu'}})).toBe('woniu')
  })
  it('处理函数',()=>{
    let fn = parse('aFunction()')
  // console.log(fn.toString())
    expect(fn({aFunction:()=> 'woniu'})).toBe('woniu')
  })

  it('处理带一个参数的函数',()=>{
    let fn = parse('aFunction(n)')
    expect(fn({aFunction:n=> n,n:42})).toBe(42)
  })
  it('处理带一个参数是函数的函数',()=>{
    let fn = parse('aFunction(argFn())')
    expect(fn({
        argFn:n=>42,
        aFunction:arg=>arg,
    })).toBe(42)
  })
  it('处理多个参数的函数',()=>{
    let fn = parse('aFunction(37,n,argFn())')
    expect(fn({
        n:3,
        argFn:n=>42,
        aFunction:(a,b,c)=>a+b+c,
    })).toBe(82)

  })
  // it('pars')
})



  // console.log(fn.toString())











})
