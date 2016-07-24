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
function headersGetter (headers) {
  var headersObj
  return function (name) {
    headersObj = headersObj || parseHeaders(headers)
    if (name) {
      return headersObj[name.toLowerCase()]
    } else {
      return headersObj
    }
  }
}
function transformData (data, headers, transform) {
  if (_.isFunction(transform)) {
    return transform(data, headers)
  } else {
    return _.reduce(transform, function (data, fn) {
      // console.log(data, fn.toString())
      return fn(data, headers)
    }, data)
  }
}

function parseHeaders (headers) {
  // console.log(headers)
  if (_.isObject(headers)) {
    return _.transform(headers, function (result, v, k) {
      result[_.trim(k.toLowerCase())] = _.trim(v)
    }, {})
  } else {
    const lines = headers.split('\n')
    return _.transform(lines, function (result, line) {
      const separatorAt = line.indexOf(':')
      const name = _.trim(line.substr(0, separatorAt)).toLowerCase()
      const value = _.trim(line.substr(separatorAt + 1))
      if (name) {
        result[name] = value
      }
    }, {})
  }
}
function $HttpProvider () {
  this.defaults = defaults
  this.$get = ['$httpBackend', '$q', '$rootScope', function ($httpBackend, $q, $rootScope) {
    function $http ({ method = 'GET', url, data, headers, transformRequest = defaults.transformRequest, transformResponse = defaults.transformResponse }) {
      const deferred = $q.defer()
      const reqData = transformData(data, headersGetter(headers), transformRequest)
      function done (status, response, headersString, statusText) {
        // console.log(headersString)
        status = Math.max(status, 0)
        deferred[isSuccess(status) ? 'resolve' : 'reject']({
          status,
          statusText,
          headers: headersGetter(headersString),
          config: {method, url, data},
          data: response
        })
        if (!$rootScope.$$phase) {
          $rootScope.$apply()
        }
      }
      function transformResponseFn (response) {
        // console.log(response)
        if (response.data) {
          response.data = transformData(response.data, response.headers,
            transformResponse)
        }
        return response
      }
      $httpBackend(method, url, reqData, done, headers)
      return deferred.promise.then(transformResponseFn)
    }
    $http.defaults = defaults
    return $http
  }]
}

export { $HttpProvider, defaults }
