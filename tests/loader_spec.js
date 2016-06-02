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
    it('可以注册module，有name属性', function() {
      var myModule = window.angular.module('myModule', []);
      expect(myModule).toBeDefined();
      expect(myModule.name).toEqual('myModule');
    });
    it('多次创建返回相同的module', function() {
      var myModule = window.angular.module('myModule', []);
      var myNewModule = window.angular.module('myModule', []);
      expect(myNewModule).not.toBe(myModule);
    });
    it('依赖数组要记录在module上', function() {
      var myModule = window.angular.module('myModule', ['myOtherModule']);
      expect(myModule.requires).toEqual(['myOtherModule']);
    });
    it('没有依赖，就是创建module', function() {
      var myModule = window.angular.module('myModule', []);
      var gotModule = window.angular.module('myModule');
      expect(gotModule).toBeDefined();
      expect(gotModule).toBe(myModule);
    });
    it('获取没定义过的module，会报错', function() {
      expect(function() {
        window.angular.module('myModule');
      }).toThrow();
    });
    it('模块名不能使hasOwnProperty', function() {
      expect(function() {
        window.angular.module('hasOwnProperty', []);
      }).toThrow();
    });


  });



})