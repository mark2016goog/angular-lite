import { setupModuleLoader } from './loader'
import { $FilterProvider } from './filter'
import { $ParseProvider } from './parse'
import { $RootScopeProvider } from './scope'
import { $QProvider } from './q'
import { $HttpBackendProvider } from './http_backend'
import { $HttpProvider } from './http'
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
  ngModule.provider('$httpBackend', $HttpBackendProvider)
  ngModule.provider('$http', $HttpProvider)
}

export { publishExternalAPI }
