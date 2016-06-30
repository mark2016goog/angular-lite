// import { HttpBackendProvider } from './http_backend'

function isSuccess (status) {
  return status >= 200 && status < 300
}

function $HttpProvider () {
  this.$get = ['$httpBackend', '$q', '$rootScope', function ($httpBackend, $q, $rootScope) {
    return function $http (config) {
      var deferred = $q.defer()
      function done (status, response, statusText) {
        status = Math.max(status, 0)
        deferred[isSuccess(status) ? 'resolve' : 'reject']({
          status,
          statusText,
          config,
          data: response
        })
        if (!$rootScope.$$phase) {
          $rootScope.$apply()
        }
      }
      $httpBackend(config.method, config.url, config.data, done)
      return deferred.promise
    }
  }]
}

export { $HttpProvider }
