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
            if (directive.link && !directive.compile) {
              directive.compile = _.constant(directive.link)
            }
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
      $updateClass (newClass, oldClass) {
        this.$$element.removeClass(oldClass).addClass(newClass)
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
      let preLinkFns = []
      let postLinkFns = []
      let newScopeDirective
      _.forEach(directives, function (directive) {
        if (directive.priority < terminalPriority) {
          return false
        }
        if (directive.scope) {
          newScopeDirective = newScopeDirective || directive
        }
        if (directive.compile) {
          let linkFn = directive.compile($compileNode, attrs)
          if (_.isFunction(linkFn)) {
            postLinkFns.push(linkFn)
          }else if (linkFn) {
            if (linkFn.pre) {
              preLinkFns.push(linkFn.pre)
            }
            if (linkFn.post) {
              postLinkFns.push(linkFn.post)
            }
          }
        }
        if (directive.terminal) {
          terminal = true
          terminalPriority = directive.priority
        }
      })
      function nodeLinkFn (childLinkFn, scope, linkNode) {
        let $element = $(linkNode)
        _.forEach(preLinkFns, linkFn => {
          linkFn(scope, $element, attrs)
        })
        if (childLinkFn) {
          childLinkFn(scope, linkNode.childNodes)
        }
        _.forEachRight(postLinkFns, linkFn => {
          linkFn(scope, $element, attrs)
        })
      }
      nodeLinkFn.terminal = terminal
      nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope
      return nodeLinkFn
    }
    function compileNodes ($compileNodes) {
      let linkFns = []
      _.forEach($compileNodes, (node, i) => {
        // console.log(node.attr)
        let attrs = new Attributes($(node))
        let directives = collectDirectives(node, attrs)
        let nodeLinkFn
        if (directives.length) {
          nodeLinkFn = applyDirectivesToNode(directives, node, attrs)
        }
        let childLinkFn
        // let terminal = applyDirectivesToNode(directives, node, attrs)
        if ((!nodeLinkFn || !nodeLinkFn.terminal) && node.childNodes && node.childNodes.length) {
          childLinkFn = compileNodes(node.childNodes)
        }
        if (nodeLinkFn && nodeLinkFn.scope) {
          attrs.$$element.addClass('ng-scope')
        }
        if (nodeLinkFn || childLinkFn) {
          linkFns.push({
            nodeLinkFn,
            childLinkFn,
            idx: i
          })
        }
      })
      function compositeLinkFn (scope, linkNodes) {
        var stableNodeList = []
        _.forEach(linkFns, function (linkFn) {
          var nodeIdx = linkFn.idx
          stableNodeList[nodeIdx] = linkNodes[nodeIdx]
        })
        _.forEach(linkFns, linkFn => {
          let node = stableNodeList[linkFns.idx]
          if (linkFn.nodeLinkFn) {
            if (linkFn.nodeLinkFn.scope) {
              scope = scope.$new()
              $(node).data('$scope', scope)
            }
            linkFn.nodeLinkFn(linkFn.childLinkFn, scope, node)
          }else {
            linkFn.childLinkFn(scope, node.childNodes)
          }
        })
      }
      return compositeLinkFn
    }
    function compile ($compileNodes) {
      // console.log($compileNodes)
      const compositeLinkFn = compileNodes($compileNodes)
      return function publicLineFn (scope) {
        $compileNodes.data('$scope', scope)
        compositeLinkFn(scope, $compileNodes)
      }
    }
    return compile
  }]
}
$CompileProvider.$inject = ['$provide']

export { $CompileProvider }
