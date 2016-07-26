import { publishExternalAPI } from '../src/angular_public'
import { createInjector } from '../src/injector'

describe('$compile', function () {
  beforeEach(function () {
    delete window.angular
    publishExternalAPI()
  })
  it('allows creating directives', function () {
    var myModule = window.angular.module('myModule', [])
    // console.log(myModule.directive.toString())
    myModule.directive('testing', function () {})
    var injector = createInjector(['ng', 'myModule'])
    expect(injector.has('testingDirective')).toBe(true)
  })
})
