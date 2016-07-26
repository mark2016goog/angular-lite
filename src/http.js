// import { HttpBackendProvider } from './http_backend'

function isSuccess (status) {
  return status >= 200 && status < 300
}
function isBlob (data) {
  return data.toString() === '[object Blob]'
}
function isFile (data) {
  return data.toString() === '[object File]'
}
function isFormData (data) {
  return data.toString() === '[object FormData]'
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
  },
  transformRequest: [function (data) {
    if (_.isObject(data) && !isBlob(data) && !isFile(data) && !isFormData(data)) {
      return JSON.stringify(data)
    }else {
      return data
    }
  }],
  transformResponse: [defaultHttpResponseTransform]
}
function defaultHttpResponseTransform (data, headers) {
  if (_.isString(data)) {
    const contentType = headers('Content-Type')
    if ((contentType && contentType.indexOf('application/json') === 0) || isJsonLike(data)) {
      return JSON.parse(data)
    }
  }
  return data
}
function isJsonLike (data) {
  try {
    JSON.parse(data)
    return true
  } catch(e) {
    return false
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
function transformData (data, headers, status, transform) {
  if (_.isFunction(transform)) {
    return transform(data, headers, status)
  } else {
    return _.reduce(transform, function (data, fn) {
      return fn(data, headers, status)
    }, data)
  }
}

function parseHeaders (headers) {
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
function buildUrl (url, serializedParams) {
  if (serializedParams.length) {
    url += (url.indexOf('?') === -1) ? '?' : '&'
    url += serializedParams
  }
  return url
}
function serializeParams (params) {
  var parts = []
  _.forEach(params, function (value, key) {
    if (_.isNull(value) || _.isUndefined(value)) {
      return false
    }
    if (!_.isArray(value)) {
      value = [value]
    }
    _.forEach(value, function (v) {
      if (_.isObject(v)) {
        v = JSON.stringify(v)
      }
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(v))
    })
  })
  return parts.join('&')
}
function $HttpProvider () {
  let interceptorFactories = this.interceptors = []
  this.defaults = defaults
  this.$get = ['$httpBackend', '$q', '$rootScope', '$injector', function ($httpBackend, $q, $rootScope, $injector) {
    let interceptors = _.map(interceptorFactories, function (fn) {
      return _.isString(fn) ? $injector.get(fn) : $injector.invoke(fn)
    })
    function $http ({ method = 'GET', url, params, data, headers, transformRequest = defaults.transformRequest, transformResponse = defaults.transformResponse }) {
      const deferred = $q.defer()
      const reqData = transformData(data, headersGetter(headers), null, transformRequest)
      function done (status, response, headersString, statusText) {
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
        if (response.data) {
          response.data = transformData(response.data, response.headers,
            response.status, transformResponse)
        }
        if (isSuccess(response.status)) {
          return response
        }else {
          return $q.reject(response)
        }
      }
      url = buildUrl(url, serializeParams(params))
      $httpBackend(method, url, reqData, done, headers)
      return deferred.promise.then(transformResponseFn, transformResponseFn)
    }
    $http.defaults = defaults
    _.forEach(['get', 'head', 'delete'], function (method) {
      $http[method] = function (url, config) {
        return $http(_.extend(config || {}, {
          method: method.toUpperCase(),
          url: url
        }))
      }
    })
    _.forEach(['post', 'put', 'patch'], function (method) {
      $http[method] = function (url, data, config) {
        return $http(_.extend(config || {}, {
          method: method.toUpperCase(),
          url: url,
          data: data
        }))
      }
    })
    return $http
  }]
}

export { $HttpProvider, defaults }
