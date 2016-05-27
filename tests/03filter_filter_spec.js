let Filter = require('../src/filter')
let register = Filter.register
let filter = Filter.filter
let parse = require('../src/parse')
let ff = require('../src/filter_filter')
describe('filter filter',()=>{
  it('可用',()=>{
    expect(ff('filter')).toBeDefined()
  })
  it('可以用函数过滤数组',()=>{
    let fn = parse('[1,2,3,4,5] | filter:isOdd')
    let scope = {
      isOdd:n=>{
        return n%2!==0
      }
    }
    expect(fn(scope)).toEqual([1,3,5])
  })
  it('可以用字符串过滤数组',()=>{
    let fn = parse('arr | filter:"a"')
    let scope = {
      arr:['a','b','c','a']
    }
    expect(fn(scope)).toEqual(['a','a'])
  })
  it('可以用字符串模糊过滤数组',()=>{
    let fn = parse('arr | filter:"a"')
    let scope = {
      arr:['a','b','ca','a']
    }
    expect(fn(scope)).toEqual(['a','ca','a'])
  })
  it('可以用字符串忽略大小写模糊过滤数组',()=>{
    let fn = parse('arr | filter:"a"')
    let scope = {
      arr:['a','b','cA','a']
    }
    expect(fn(scope)).toEqual(['a','cA','a'])
  })
})