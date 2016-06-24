import { setupModuleLoader } from './loader'
import { $FilterProvider } from './filter'
import { $ParseProvider } from './parse'
import { $RootScopeProvider } from './scope'
import { $QProvider } from './q'
/**
 * 注册全局模块
 */
function publishExternalAPI () {
  setupModuleLoader(window)
  const ngModule = angular.module('ng', [])
  ngModule.provider('$filter', $FilterProvider)
  ngModule.provider('$parse', $ParseProvider)
  ngModule.provider('$rootScope', $RootScopeProvider)
  ngModule.provider('$q', $QProvider)
}

export { publishExternalAPI }
