'use strict'

import {setupModuleLoader} from '../src/loader'
import {createInjector} from '../src/injector'
describe('测试injector', () => {
  beforeEach(function() {
    delete window.angular;
    setupModuleLoader(window)
  });

it('创建注入器', function() {
var injector = createInjector([]);
expect(injector).toBeDefined();
});

})