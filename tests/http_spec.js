// var sinon = require('sinon')

import { publishExternalAPI } from '../src/angular_public'
import { createInjector } from '../src/injector'
describe('$http', function () {
  var $http
  var xhr
  var requests
  beforeEach(function () {
    publishExternalAPI()
    var injector = createInjector(['ng'])
    $http = injector.get('$http')
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
  xit('returns a Promise', function () {
    var result = $http({})
    expect(result).toBeDefined()
    expect(result.then).toBeDefined()
  })
})
