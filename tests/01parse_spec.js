let parse = require('../src/parse')
let _ = require('lodash')
describe('Parse', () => {
  it('can parse an integer',()=>{
    let fn = parse('42')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('can parse a folating point number',()=>{
    let fn = parse('4.2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(4.2)
  })
  it('can parse a folating point number without an interger part',()=>{
    let fn = parse('.42')
    expect(fn).toBeDefined()
    expect(fn()).toBe(0.42)
  })
})
