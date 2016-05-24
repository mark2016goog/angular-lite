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

  it('can parse a folating point number in scientific notataion',()=>{
    let fn = parse('42e3')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42000)
  })
  it('can parse scientific notataion with a foat coefficient',()=>{
    let fn = parse('.42e2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('can parse scientific notataion with negative exponents',()=>{
    let fn = parse('4200e-2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('can parse scientific notataion with the + sign',()=>{
    let fn = parse('.42e+2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('can parse upper case scientific notataion',()=>{
    let fn = parse('.42E2')
    expect(fn).toBeDefined()
    expect(fn()).toBe(42)
  })
  it('will not parse  invalid scientific notataion',()=>{
    expect(()=>{parse('42e-')}).toThrow()
    expect(()=>{parse('42e-a')}).toThrow()
  })

  it('can parse a string in single quotes',()=>{
    let fn = parse("'abc'")
    expect(fn()).toBe('abc')
  })
  it('can parse a string in double quotes',()=>{
    let fn = parse('"abc"')
    expect(fn()).toBe('abc')
  })




















})
