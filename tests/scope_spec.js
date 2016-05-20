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
  it('digest',()=>{
  	var watchFn = ()=>'wat'
  	var listenFn = jasmine.createSpy()
  	scope.$watch(watchFn,listenFn)
  	scope.$digest()
  	expect(listenFn).toHaveBeenCalled()
  })

});
