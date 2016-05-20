var Scope = require('../src/scope')

describe('Scope', () => {
  var scope
  beforeEach(()=>{
  	scope = new Scope
  })

  it('should be uses as an object', () => {
    scope.aProperty = 1
    expect(scope.aProperty ).toBe(1);
    scope.aProperty = 3
    expect(scope.aProperty ).toBe(3);
  });
  it('digest can call listen function',()=>{
  	var watchFn = ()=>'wat'
  	var listenFn = jasmine.createSpy()
  	scope.$watch(watchFn,listenFn)
  	scope.$digest()
  	expect(listenFn).toHaveBeenCalled()
  	// expect(listenFn).toHaveBeenCalledWith(scope)
  })
  it('call the watch function with scope as argumetns',()=>{
  	var watchFn = jasmine.createSpy()
  	var listenFn = ()=>{}
  	scope.$watch(watchFn,listenFn)
  	scope.$digest()
  	expect(watchFn).toHaveBeenCalledWith(scope)

  })
  it('call the listen function when the watched value change',()=>{
  	scope.someValue = 'a'
  	scope.counter = 0
  	scope.$watch(scope=>{
  		return scope.someValue
  	},(newVal,oldVal,scope)=>{
  		scope.counter++
  	})
  	expect(scope.counter).toBe(0)
  	scope.$digest()
  	expect(scope.counter).toBe(1)
  	scope.$digest()
  	expect(scope.counter).toBe(1)

  	scope.someValue = 'b'
  	expect(scope.counter).toBe(1)

  	scope.$digest()
  	expect(scope.counter).toBe(2)

  })
});



















