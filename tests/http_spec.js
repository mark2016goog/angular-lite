// var sinon = require('sinon')

import { publishExternalAPI } from '../src/angular_public'
import { createInjector } from '../src/injector'
import { defaults } from '../src/http'
// var origin_defaults = JSON.parse(JSON.stringify(defaults))
// console.log(origin_defaults.transformRequest[0])
var _ = require('lodash')
var sinon = require('sinon')

xdescribe('$http', function () {
  var $http
  var xhr
  var requests
  var origin_defaults
  beforeEach(function () {
    publishExternalAPI()
    var injector = createInjector(['ng'])
    $http = injector.get('$http')
  // console.log(1)
  })
  beforeEach(function () {
    xhr = sinon.useFakeXMLHttpRequest()
    requests = []
    xhr.onCreate = function (req) {
      requests.push(req)
    }
  })

  afterEach(function () {
    xhr.restore()
  })

  it('is a function', function () {
    expect($http instanceof Function).toBe(true)
  })
  it('returns a Promise', function () {
    var result = $http({})
    expect(result).toBeDefined()
    expect(result.then).toBeDefined()
  })
  it('makes an XMLHttpRequest to given URL', function () {
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 'hello'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].method).toBe('POST')
    expect(requests[0].url).toBe('http://teropa.info')
    expect(requests[0].async).toBe(true)
    expect(requests[0].requestBody).toBe('hello')
  })
  it('resolves promise when XHR result received', function () {
    var requestConfig = {
      method: 'GET',
      url: 'http://teropa.info'
    }
    var response
    $http(requestConfig).then(function (r) {
      response = r
    })
    requests[0].respond(200, {}, 'Hello')
    expect(response).toBeDefined()
    expect(response.status).toBe(200)
    expect(response.statusText).toBe('OK')
    expect(response.data).toBe('Hello')
    expect(response.config.url).toEqual('http://teropa.info')
  })
  it('rejects promise when XHR result received with error status', function () {
    var requestConfig = {
      method: 'GET',
      url: 'http://teropa.info'
    }
    var response
    $http(requestConfig).catch(function (r) {
      response = r
    })
    requests[0].respond(401, {}, 'Fail')
    expect(response).toBeDefined()
    expect(response.status).toBe(401)
    expect(response.statusText).toBe('Unauthorized')
    expect(response.data).toBe('Fail')
    expect(response.config.url).toEqual('http://teropa.info')
  })
  it('rejects promise when XHR result errors/aborts', function () {
    var requestConfig = {
      method: 'GET',
      url: 'http://teropa.info'
    }
    var response
    $http(requestConfig).catch(function (r) {
      response = r
    })
    requests[0].onerror()
    expect(response).toBeDefined()
    expect(response.status).toBe(0)
    expect(response.data).toBe(null)
    expect(response.config.url).toEqual('http://teropa.info')
  })
  it('uses GET method by default', function () {
    $http({
      url: 'http://teropa.info'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].method).toBe('GET')
  })
  it('sets headers on request', function () {
    $http({
      url: 'http://teropa.info',
      headers: {
        'Accept': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders.Accept).toBe('text/plain')
    expect(requests[0].requestHeaders['Cache-Control']).toBe('no-cache')
  })

  it('sets default headers on request', function () {
    $http({
      url: 'http://teropa.info'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders.Accept).toBe(
      'application/json, text/plain, */*')
  })
  it('sets method-specific default headers on request', function () {
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: '42'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders['Content-Type']).toBe(
      'application/json;charset=utf-8')
  })

  xit('exposes default headers for overriding', function () {
    $http.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8'
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: '42'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders['Content-Type']).toBe(
      'text/plain;charset=utf-8')
  })
  xit('exposes default headers through provider', function () {
    var injector = createInjector(['ng', function ($httpProvider) {
      $httpProvider.defaults.headers.post['Content-Type'] =
        'text/plain;charset=utf-8'
    }])
    $http = injector.get('$http')
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: '42'
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders['Content-Type']).toBe(
      'text/plain;charset=utf-8')
  })
  it('does not send content-type header when no data', function () {
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      }
    })
    expect(requests.length).toBe(1)
    expect(requests[0].requestHeaders['Content-Type']).not.toBe(
      'application/json;charset=utf-8')
  })

  it('makes response headers available', function () {
    var response
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {'Content-Type': 'text/plain'}, 'Hello')
    expect(response.headers).toBeDefined()
    expect(response.headers instanceof Function).toBe(true)
    expect(response.headers('Content-Type')).toBe('text/plain')
    expect(response.headers('content-type')).toBe('text/plain')
  })
  it('may returns all response headers', function () {
    var response
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {'Content-Type': 'text/plain'}, 'Hello')
    expect(response.headers()).toEqual({'content-type': 'text/plain'})
  })
  it('allows transforming requests with functions', function () {
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42,
      transformRequest: function (data) {
        return '*' + data + '*'
      }
    })
    expect(requests[0].requestBody).toBe('*42*')
  })
  it('allows multiple request transform functions', function () {
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42,
      transformRequest: [function (data) {
        return '*' + data + '*'
      }, function (data) {
        return '-' + data + '-'
      }]
    })
    expect(requests[0].requestBody).toBe('-*42*-')
  })
  xit('allows settings transforms in defaults', function () {
    $http.defaults.transformRequest = [function (data) {
      return '*' + data + '*'
    }]
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42
    })
    expect(requests[0].requestBody).toBe('*42*')
  })
  xit('passes request headers getter to transforms', function () {
    $http.defaults.transformRequest = [function (data, headers) {
      if (headers('Content-Type') === 'text/emphasized') {
        return '*' + data + '*'
      } else {
        return data
      }
    }]
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42,
      headers: {
        'content-type': 'text/emphasized'
      }
    })
    expect(requests[0].requestBody).toBe('*42*')
  })
  xit('passes request headers getter to transforms', function () {
    $http.defaults.transformRequest = [function (data, headers) {
      if (headers('Content-Type') === 'text/emphasized') {
        return '*' + data + '*'
      } else {
        return data
      }
    }]
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: 42,
      headers: {
        'content-type': 'text/emphasized'
      }
    })
    expect(requests[0].requestBody).toBe('*42*')
  })
  xit('allows transforming responses with functions', function () {
    var response
    $http.defaults.transformRequest = []
    $http({
      url: 'http://teropa.info',
      transformResponse: function (data) {
        return '*' + data + '*'
      }
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {'Content-Type': 'text/plain'}, 'Hello')
    expect(response.data).toEqual('*Hello*')
  })
  it('passes response headers to transform functions', function () {
    var response
    $http({
      url: 'http://teropa.info',
      transformResponse: function (data, headers) {
        if (headers('content-type') === 'text/decorated') {
          return '*' + data + '*'
        } else {
          return data
        }
      }
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {'Content-Type': 'text/decorated'}, 'Hello')
    expect(response.data).toEqual('*Hello*')
  })
  xit('allows setting default response transforms', function () {
    $http.defaults.transformResponse = [function (data) {
      return '*' + data + '*'
    }]
    var response
    $http({
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {'Content-Type': 'text/plain'}, 'Hello')
    expect(response.data).toEqual('*Hello*')
  })
  it('transforms error responses also', function () {
    var response
    $http({
      url: 'http://teropa.info',
      transformResponse: function (data) {
        return '*' + data + '*'
      }
    }).catch(function (r) {
      response = r
    })
    requests[0].respond(401, {'Content-Type': 'text/plain'}, 'Fail')
    expect(response.data).toEqual('*Fail*')
  })
  it('passes HTTP status to response transformers', function () {
    var response
    $http({
      url: 'http://teropa.info',
      transformResponse: function (data, headers, status) {
        if (status === 401) {
          return 'unauthorized'
        } else {
          return data
        }
      }
    }).catch(function (r) {
      response = r
    })
    requests[0].respond(401, {'Content-Type': 'text/plain'}, 'Fail')
    expect(response.data).toEqual('unauthorized')
  })
  it('serializes object data to JSON for requests', function () {
    // $http.defaults = d
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: {aKey: 42}
    })
    // $rootScope.$apply()
    expect(requests[0].requestBody).toBe('{"aKey":42}')
  })
  it('serializes array data to JSON  for requests', function () {
    // $http.defaults = 
    // defatuls呗上面几个测试修改了，上面先注释
    // console.log($http.defaults)
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: [1, 'two', 3]
    })
    expect(requests[0].requestBody).toBe('[1,"two",3]')
  })
  it('does not serialize blobs for requests', function () {
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder
    var bb = new BlobBuilder()
    bb.append('hello')
    var blob = bb.getBlob('text/plain')
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: blob
    })
    expect(requests[0].requestBody).toBe(blob)
  })
  it('does not serialize form data for requests', function () {
    var formData = new FormData()
    formData.append('aField', 'aValue')
    $http({
      method: 'POST',
      url: 'http://teropa.info',
      data: formData
    })
    expect(requests[0].requestBody).toBe(formData)
  })
  it('parses JSON data for JSON responses', function () {
    var response
    $http({
      method: 'GET',
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(
      200,
      {'Content-Type': 'application/json'},
      '{"message":"hello"}'
    )
    expect(_.isObject(response.data)).toBe(true)
    expect(response.data.message).toBe('hello')
  })
  it('parses a JSON object response without content type', function () {
    var response
    $http({
      method: 'GET',
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {}, '{"message":"hello"}')
    expect(_.isObject(response.data)).toBe(true)
    expect(response.data.message).toBe('hello')
  })
  it('parses a JSON array response without content type', function () {
    var response
    $http({
      method: 'GET',
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {}, '[1, 2, 3]')
    expect(_.isArray(response.data)).toBe(true)
    expect(response.data).toEqual([1, 2, 3])
  })
  it('does not choke on response resembling JSON but not valid', function () {
    var response
    $http({
      method: 'GET',
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {}, '{1, 2, 3]')
    expect(response.data).toEqual('{1, 2, 3]')
  })
  it('does not try to parse interpolation expr as JSON', function () {
    var response
    $http({
      method: 'GET',
      url: 'http://teropa.info'
    }).then(function (r) {
      response = r
    })
    requests[0].respond(200, {}, '{{expr}}')
    expect(response.data).toEqual('{{expr}}')
  })
  it('adds params to URL', function () {
    $http({
      url: 'http://teropa.info',
      params: {
        a: 42
      }
    })
    expect(requests[0].url).toBe('http://teropa.info?a=42')
  })
  it('adds additional params to URL', function () {
    $http({
      url: 'http://teropa.info?a=42',
      params: {
        b: 42
      }
    })
    expect(requests[0].url).toBe('http://teropa.info?a=42&b=42')
  })
  it('escapes url characters in params', function () {
    $http({
      url: 'http://teropa.info',
      params: {
        '==': '&&'
      }
    })
    expect(requests[0].url).toBe('http://teropa.info?%3D%3D=%26%26')
  })
  it('does not attach null or undefined params', function () {
    $http({
      url: 'http://teropa.info',
      params: {
        a: null,
        b: undefined
      }
    })
    expect(requests[0].url).toBe('http://teropa.info')
  })
  it('attaches multiple params from arrays', function () {
    $http({
      url: 'http://teropa.info',
      params: {
        a: [42, 43]
      }
    })
    expect(requests[0].url).toBe('http://teropa.info?a=42&a=43')
  })
  it('serializes objects to json', function () {
    $http({
      url: 'http://teropa.info',
      params: {
        a: {b: 42}

      }
    })
    expect(requests[0].url).toBe('http://teropa.info?a=%7B%22b%22%3A42%7D')
  })
  it('supports shorthand method for GET', function () {
    $http.get('http://teropa.info', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('GET')
  })
  it('supports shorthand method for HEAD', function () {
    $http.head('http://teropa.info', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('HEAD')
  })
  it('supports shorthand method for DELETE', function () {
    $http.delete('http://teropa.info', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('DELETE')
  })
  it('supports shorthand method for POST with data', function () {
    $http.post('http://teropa.info', 'data', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('POST')
    expect(requests[0].requestBody).toBe('data')
  })
  it('supports shorthand method for PUT with data', function () {
    $http.put('http://teropa.info', 'data', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('PUT')
    expect(requests[0].requestBody).toBe('data')
  })
  it('supports shorthand method for PATCH with data', function () {
    $http.patch('http://teropa.info', 'data', {
      params: {q: 42}
    })
    expect(requests[0].url).toBe('http://teropa.info?q=42')
    expect(requests[0].method).toBe('PATCH')
    expect(requests[0].requestBody).toBe('data')
  })
  it('allows attaching interceptor factories', function () {
    var interceptorFactorySpy = jasmine.createSpy()
    var injector = createInjector(['ng', function ($httpProvider) {
      $httpProvider.interceptors.push(interceptorFactorySpy)
    }])
    $http = injector.get('$http')
    expect(interceptorFactorySpy).toHaveBeenCalled()
  })
  it('uses DI to instantiate interceptors', function () {
    var interceptorFactorySpy = jasmine.createSpy()
    var injector = createInjector(['ng', function ($httpProvider) {
      $httpProvider.interceptors.push(['$rootScope', interceptorFactorySpy])
    }])
    $http = injector.get('$http')
    var $rootScope = injector.get('$rootScope')
    expect(interceptorFactorySpy).toHaveBeenCalledWith($rootScope)
  })
  it('allows referencing existing interceptor factories', function () {
    var interceptorFactorySpy = jasmine.createSpy().and.returnValue({})
    var injector = createInjector(['ng', function ($provide, $httpProvider) {
      $provide.factory('myInterceptor', interceptorFactorySpy)
      $httpProvider.interceptors.push('myInterceptor')
    }])
    $http = injector.get('$http')
    expect(interceptorFactorySpy).toHaveBeenCalled()
  })
  it('x')
})
