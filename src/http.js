// import { HttpBackendProvider } from './http_backend'

function isSuccess (status) {
  return status >= 200 && status < 300
}
var defaults = {
  headers: {
    common: {
      Accept: 'application/json, text/plain, */*'
    },
    post: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    put: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    patch: {
      'Content-Type': 'application/json;charset=utf-8'
    }
  }
}
function $HttpProvider () {
  this.defaults = defaults
  this.$get = ['$httpBackend', '$q', '$rootScope', function ($httpBackend, $q, $rootScope) {
    function $http ({ method='GET', url, data, headers}) {
      var deferred = $q.defer()
      function done (status, response, statusText) {
        status = Math.max(status, 0)
        deferred[isSuccess(status) ? 'resolve' : 'reject']({
          status,
          statusText,
          config: {method, url, data},
          data: response
        })
        if (!$rootScope.$$phase) {
          $rootScope.$apply()
        }
      }
      $httpBackend(method, url, data, done, headers)
      return deferred.promise
    }
    $http.defaults = defaults
    return $http
  }]
}

export { $HttpProvider, defaults }
