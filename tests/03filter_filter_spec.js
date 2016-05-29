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

  it('可以过滤数组',()=>{
    let fn = parse('arr | filter:"o"')
    let scope = {
      arr:[{name:'john',test:'Brown'},
          {name:'jane',test:'Fox'},
          {name:'Mary',test:'Quick'},]
    }
    expect(fn(scope)).toEqual([
          {name:'john',test:'Brown'},
          {name:'jane',test:'Fox'},])
  })

  it('可以过滤嵌套的数组',()=>{
    let fn = parse('arr | filter:"o"')
    let scope = {
      arr:[{name:{name:'john',test:'Brown'}},
          {name:{name:'jane',test:'Fox'}},
          {name:{name:'Mary',test:'Quick'}},]
    }
    expect(fn(scope)).toEqual([
          {name:{name:'john',test:'Brown'}},
          {name:{name:'jane',test:'Fox'}}])
  })

  it('可以过滤长度不一的数组',()=>{
    let fn = parse('arr | filter:"o"')
    let scope = {
      arr:[{name:'john',test:'Brown'},
          {name:'jane'}]
    }
    expect(fn(scope)).toEqual([
          {name:'john',test:'Brown'}])
  })
  it('用数字过滤',()=>{
    let fn = parse('arr | filter:42')
    let scope = {
      arr:[{name:'john',test:42},
          {name:'jane',test:43},
          {name:'Mary',test:44}]
    }
    expect(fn(scope)).toEqual([
          {name:'john',test:42}])
  })
  it('用布尔过滤',()=>{
    let fn = parse('arr | filter:true')
    let scope = {
      arr:[{name:'john',test:true},
          {name:'jane',test:false},
          {name:'Mary',test:false}]
    }
    expect(fn(scope)).toEqual([
          {name:'john',test:true}])
  })

  it('用数字模糊过滤字符串',()=>{
    let fn = parse('arr | filter:42')
    let scope = {
      arr:[{name:'john',test:42},
          {name:'jane',test:'$42yuan'},
          {name:'Mary',test:44}]
    }
    expect(fn(scope)).toEqual([
          {name:'john',test:42},
          {name:'jane',test:'$42yuan'}])
  })

  it('过滤null',()=>{
    let fn = parse('arr | filter:null')
    let scope = {
      arr:[null,undefined,'not null']
    }
    expect(fn(scope)).toEqual([null])
  })

  it('过滤null字符串',()=>{
    let fn = parse('arr | filter:"null"')
    let scope = {
      arr:[null,undefined,'not null']
    }
    expect(fn(scope)).toEqual(['not null'])
  })

  it('不匹配undefined',()=>{
    let fn = parse('arr | filter:"undefined"')
    let scope = {
      arr:[null,undefined,'not undefined']
    }
    expect(fn(scope)).toEqual(['not undefined'])
  })

  it('!开头取反过滤',()=>{
    let fn = parse('arr | filter:"!a"')
    let scope = {
      arr:['cc','b','ca','a']
    }
    expect(fn(scope)).toEqual(['cc','b'])
  })



















})