let $ = require('jquery')
const PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i
var BOOLEAN_ATTRS = {
  multiple: true,
  selected: true,
  checked: true,
  disabled: true,
  readOnly: true,
  required: true,
  open: true
}
var BOOLEAN_ELEMENTS = {
  INPUT: true,
  SELECT: true,
  OPTION: true,
  TEXTAREA: true,
  BUTTON: true,
  FORM: true,
  DETAILS: true
}
function nodeName (element) {
  return element.nodeName ? element.nodeName : element[0].nodeName
}
function directiveNormalize (name) {
  return _.camelCase(name.replace(PREFIX_REGEXP, ''))
}
function isBooleanAttribute (node, attrName) {
  return BOOLEAN_ATTRS[attrName] && BOOLEAN_ELEMENTS[node.nodeName]
}
function $CompileProvider ($provide) {
  var hasDirectives = {}
  this.directive = function (name, directiveFactory) {
    if (_.isString(name)) {
      if (name === 'hasOwnProperty') {
        throw 'hasOwnProperty is not a valid directive name'
      }
      if (!hasDirectives.hasOwnProperty(name)) {
        hasDirectives[name] = []

        $provide.factory(name + 'Directive', ['$injector', function ($injector) {
          var factories = hasDirectives[name]
          // directive.name = directive.name || name
          // $injector.invoke
          return _.map(factories, (factory, i) => {
            let directive = $injector.invoke(factory)
            directive.name = directive.name || name
            directive.priority = directive.priority || 0
            directive.index = i
            return directive
          })
        }])
      }
      hasDirectives[name].push(directiveFactory)
    }else {
      _.forEach(name, (directiveFactory, name) => {
        this.directive(name, directiveFactory)
      })
    }

  // $provide.factory(name + 'Directive', directiveFactory)
  }
  this.$get = ['$injector', '$rootScope', function ($injector, $rootScope) {
    class Attributes {
      constructor (element) {
        this.$$element = element
      }
      $set (key, value, writeAttr) {
        this[key] = value
        if (isBooleanAttribute(this.$$element[0], key)) {
          this.$$element.prop(key, value)
        }
        if (writeAttr !== false) {
          this.$$element.attr(key, value)
        }
        if (this.$$observers) {
          _.forEach(this.$$observers[key], (observer) => {
            try {
              observer(value)
            } catch(e) {
              console.log(e)
            }
          })
        }
      }
      $observe (key, fn) {
        this.$$observers = this.$$observers || {}
        this.$$observers[key] = this.$$observers[key] || []
        this.$$observers[key].push(fn)
        $rootScope.$evalAsync(() => {
          fn(this[key])
        })
        return () => {
          let index = this.$$observers[key].indexOf(fn)
          if (index >= 0) {
            this.$$observers[key].splice(index, 1)
          }
        }
      }
      $addClass (classVal) {
        this.$$element.addClass(classVal)
      }
      $removeClass (classVal) {
        this.$$element.removeClass(classVal)
      }
    }
    function addDirective (directives, name) {
      if (hasDirectives.hasOwnProperty(name)) {
        directives.push.apply(directives, $injector.get(name + 'Directive'))
        return true
      }
    }
    function collectDirectives (node, attrs) {
      let directives = []
      let normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase())
      addDirective(directives, normalizedNodeName)
      _.forEach(node.attributes, attr => {
        let normalizedAttrName = directiveNormalize(attr.name.toLowerCase())
        const isNgAttr = /^ngAttr[A-Z]/.test(normalizedAttrName)
        if (isNgAttr) {
          normalizedAttrName = normalizedAttrName[6].toLowerCase() + normalizedAttrName.substring(7)
        }
        addDirective(directives, normalizedAttrName)
        if (isNgAttr || !attrs.hasOwnProperty(normalizedAttrName)) {
          attrs[normalizedAttrName] = attr.value.trim()
          if (isBooleanAttribute(node, normalizedAttrName)) {
            attrs[normalizedAttrName] = true
          }
        }
      })
      _.forEach(node.classList, cls => {
        let normalizedClassName = directiveNormalize(cls)
        if (addDirective(directives, normalizedClassName)) {
          attrs[normalizedClassName] = undefined
        }
      })
      directives.sort(byPriority)
      return directives
    }
    function byPriority (a, b) {
      let diff = b.priority - a.priority
      if (diff !== 0) {
        return diff
      } else {
        if (a.name !== b.name) {
          return (a.name < b.name ? -1 : 1)
        } else {
          return a.index - b.index
        }
      }
    }
    function applyDirectivesToNode (directives, compileNode, attrs) {
      const $compileNode = $(compileNode)
      let terminalPriority = -Number.MAX_VALUE
      let terminal = false
      _.forEach(directives, function (directive) {
        if (directive.priority < terminalPriority) {
          return false
        }
        if (directive.compile) {
          directive.compile($compileNode, attrs)
        }
        if (directive.terminal) {
          terminal = true
          terminalPriority = directive.priority
        }
      })
      return terminal
    }
    function compileNodes ($compileNodes) {
      _.forEach($compileNodes, (node) => {
        // console.log(node.attr)
        let attrs = new Attributes($(node))
        let directives = collectDirectives(node, attrs)

        let terminal = applyDirectivesToNode(directives, node, attrs)
        if (!terminal && node.childNodes && node.childNodes.length) {
          compileNodes(node.childNodes)
        }
      })
    }
    function compile ($compileNodes) {
      return compileNodes($compileNodes)
    }
    return compile
  }]
}
$CompileProvider.$inject = ['$provide']

export { $CompileProvider }
