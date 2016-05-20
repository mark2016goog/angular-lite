var Scope = require('../src/scope')

describe('1+1', () => {

  it('should be uses as an object', () => {
    var scope = new Scope()
    scope.aProperty = 1
    expect(scope.aProperty ).toBe(1);
  });

});
