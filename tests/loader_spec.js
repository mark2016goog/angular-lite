'use strict'

import {
  setupModuleLoader
} from '../src/loader'
describe('测试loader', () => {
  beforeEach(function() {
    delete window.angular;
  });
  it("全局angular绑定在window上", () => {
    setupModuleLoader(window)
    expect(window.angular).toBeDefined()
  })
  it('angular只创建一次1', function() {
    setupModuleLoader(window);
    var ng = window.angular;
    setupModuleLoader(window);
    expect(window.angular).toBe(ng);
  });
  it('angular.module定义好', function() {
    setupModuleLoader(window);
    expect(window.angular.module).toBeDefined();
  });
  it('angualr.module也只创建一次', function() {
    setupModuleLoader(window);
    var module = window.angular.module;
    setupModuleLoader(window);
    expect(window.angular.module).toBe(module);
  });
  describe('modules', function() {
    beforeEach(function() {
      setupModuleLoader(window);
    });




  });



})