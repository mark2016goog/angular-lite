'use strict';
import {
  setupModuleLoader
} from './loader'
import {$FilterProvider} from './filter'
import {$ParseProvider} from './parse'
import {$RootScopeProvider} from './scope'
function publishExternalAPI() {
  setupModuleLoader(window);
  let ngModule = angular.module('ng',[])
  ngModule.provider('$filter', $FilterProvider);
ngModule.provider('$parse', $ParseProvider);
ngModule.provider('$rootScope', $RootScopeProvider);
}

export {publishExternalAPI}