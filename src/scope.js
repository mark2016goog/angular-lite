'use strict'

const _ = require('lodash')
const initWatchFn = () => {}
  //  防止object中有length属性
const isArrayLike = obj => {
  if (_.isNull(obj) || _.isUndefined(obj)) {
    return false
  }
  var length = obj.length
  return length === 0 ||
    (_.isNumber(length) && length > 0 && (length - 1) in obj)
}
class Scope {
  constructor() {
    //  $watch队列
    this.$$watchers = []
    this.$$lastDirtyWatch = null
      //  $evalasync队列
    this.$$asyncQueue = []
      //  applyAsync队列
    this.$$applyAsyncQueue = []
      //  $postDigest队列
    this.$$postDigestQueue = []
    this.$$applyAsyncId = null
    this.$root = this
      // 记录子scope 方便递归digest $new中维护
    this.$$children = []
    // 事件
    this.$$listeners = {}
      //  记录状态是$digest，还是$apply
    this.$$phase = null
  }
  //  监听
  $watch(watchFn, listenerFn, valueEq) {
    const watcher = {
      watchFn: watchFn,
      listenerFn: listenerFn || function() {},
      last: initWatchFn,
      valueEq: !!valueEq // 是否递归比较
    }
    this.$$watchers.unshift(watcher)
      //  上次dirty出发的watchFn
    this.$root.$$lastDirtyWatch = null
      //  返回函数，执行可以注销watch 直接执行splice
    return () => {
      const index = this.$$watchers.indexOf(watcher)
      if (index >= 0) {
        this.$$watchers.splice(index, 1)
        this.$root.$$lastDirtyWatch = null
      }
    }
  }
    // 和$watch(true)类似，不过不全量检查
    // arr = [{name:1}]
    // arr.push shift arr[0] = 1都检查
    // arr[0].name=2不检查 因为引用没变
  $watchCollection(watchFn, listenerFn) {
    let newVal, oldVal
    let veryOldVal
    const trackVeryOldValue = (listenerFn.length > 1)
      //  有不同的，就+1外部$watch就能检测到变化
    let changeCount = 0
    let firstRun = true
    const internalWatchFn = scope => {
      newVal = watchFn(scope)
        //  也是操碎了心
      if (_.isObject(newVal)) {
        if (isArrayLike(newVal)) {
          if (!_.isArray(oldVal)) {
            changeCount++
            oldVal = []
          }
          if (newVal.length !== oldVal.length) {
            changeCount++
            oldVal.length = newVal.length
          }
          _.forEach(newVal, (newItem, i) => {
            const bothNaN = _.isNaN(newItem) && _.isNaN(oldVal[i])
            if (!bothNaN && newItem !== oldVal[i]) {
              changeCount++
              oldVal[i] = newItem
            }
          })
        } else {
          if (!_.isObject(oldVal) || isArrayLike(oldVal)) {
            changeCount++
            oldVal = {}
          }
          //  循环比较对象
          _.forOwn(newVal, (newItem, key) => {
            const bothNaN = _.isNaN(newItem) && _.isNaN(oldVal[key])
            if (!bothNaN && oldVal[key] !== newItem) {
              changeCount++
              oldVal[key] = newItem
            }
          })

          // 再比较一次，如果确保相等，被删除元素也能比较出来
          _.forOwn(oldVal, (oldItem, key) => {
            const bothNaN = _.isNaN(oldItem) && _.isNaN(newVal[key])
            if (!bothNaN && newVal[key] !== oldItem) {
              changeCount++
              newVal[key] = oldItem
            }
          })
        }
      } else {
        if (!this.$$areEqual(newVal, oldVal, false)) {
          changeCount++
        }
        oldVal = newVal
      }
      return changeCount
    }
    const internalListenerFn = () => {
      if (firstRun) {
        listenerFn(newVal, newVal, this)
        firstRun = false
      } else {
        listenerFn(newVal, veryOldVal, this)
      }
      if (trackVeryOldValue) {
        veryOldVal = _.clone(newVal)
      }
    }
    return this.$watch(internalWatchFn, internalListenerFn)
  }
  $new(isolated, parent) {
    let childScope
    parent = parent || this
    if (isolated) {
      childScope = new Scope()
      childScope.$root = parent.$root
      childScope.$$asyncQueue = parent.$$asyncQueue
      childScope.$$postDigestQueue = parent.$$postDigestQueue
      childScope.$$applyAsyncQueue = parent.$$applyAsyncQueue
    } else {
      childScope = Object.create(this)
    }
    //  保存在$$children中
    parent.$$children.push(childScope)
      //  每个继承的scope有自己的wathcers
    childScope.$$watchers = []
    childScope.$$children = []
    childScope.$$listeners = {}
    childScope.$parent = parent
    return childScope
  }
    //  监听多个
  $watchGroup(watchFns, listenerFn) {
    const newVals = new Array(watchFns.length)
    const oldVals = new Array(watchFns.length)

    let changeReactionScheduled = false
    let firstRun = true

    if (watchFns.length === 0) {
      let shouldCall = true
      this.$evalAsync(() => {
        if (shouldCall) {
          listenerFn(newVals, newVals, this)
        }
      })
      return () => {
        shouldCall = false
      }
    }

    const watchGroupListener = () => {
      if (firstRun) {
        firstRun = false
        listenerFn(newVals, newVals, this)
      } else {
        listenerFn(newVals, oldVals, this)
      }
      changeReactionScheduled = false
    }

    const destroyFns = _.map(watchFns, (watchFn, i) => {
      return this.$watch(watchFn, (newVal, oldVal) => {
        newVals[i] = newVal
        oldVals[i] = oldVal
          //  evalAsync是最后才执行的
        if (!changeReactionScheduled) {
          changeReactionScheduled = true
          this.$evalAsync(watchGroupListener)
            //  listenerFn(newVals,oldVals,this)
        }
      })
    })

    return () => {
      destroyFns.forEach((desFn, i) => {
        desFn()
      })
    }
  }
  $digest() {
    let dirty
      // 十次都不稳定，就报错
    let ttl = 10
      // 记录上次dirty的watch
    this.$root.$$lastDirtyWatch = null
      // 用$$phase记录状态
    this.$begainPhase('$digest')
    if (this.$root.$$applyAsyncId) {
      clearTimeout(this.$root.$$applyAsyncId)
      this.$$flushApplyAsync()
    }
    do {
      //  evalasync队列取出执行
      while (this.$$asyncQueue.length) {
        const asyncTask = this.$$asyncQueue.shift()
        try {
          asyncTask.scope.$eval(asyncTask.expression)
        } catch (e) {
          console.log(e)
        }
      }
      dirty = this.$$digestOnce()
      if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
        throw '10 digest interations reached'
      }
    } while (dirty || this.$$asyncQueue.length)
    this.$clearPhase()

    //  postdigest
    while (this.$$postDigestQueue.length) {
      try {
        this.$$postDigestQueue.shift()()
      } catch (e) {
        console.error(e)
      }
    }
  }
  $eval(fn, arg) {
    return fn(this, arg)
  }
  $apply(fn) {
    try {
      this.$begainPhase('$apply')
      return this.$eval(fn)
    } finally {
      this.$clearPhase()
      this.$root.$digest()
    }
  }
  $evalAsync(fn) {
    if (!this.$$phase && !this.$$asyncQueue.length) {
      setTimeout(() => {
        if (this.$$asyncQueue.length) {
          this.$root.$digest()
        }
      }, 0)
    }
    this.$$asyncQueue.push({
      scope: this,
      expression: fn
    })
  }
  $applyAsync(fn) {
    this.$$applyAsyncQueue.push(() => {
      this.$eval(fn)
    })
    if (this.$root.$$applyAsyncId === null) {
      this.$$applyAsyncId = setTimeout(() => {
        this.$apply(() => {
          this.$$flushApplyAsync()
        })
          //  this.$apply(_.bind(this.$$flushApplyAsync,this))
      }, 0)
    }
  }
  $$everyScope(fn) {
    if (fn(this)) {
      return this.$$children.every(child => {
        return child.$$everyScope(fn)
      })
    } else {
      return false
    }
  }
  $$flushApplyAsync() {
    while (this.$$applyAsyncQueue.length) {
      try {
        this.$$applyAsyncQueue.shift()()
      } catch (e) {
        console.log(e)
      }
    }
    this.$root.$$applyAsyncId = null
  }
  $$postDigest(fn) {
    this.$$postDigestQueue.push(fn)
  }
  $$digestOnce() {
    let dirty
    let continueLoop = true
    this.$$everyScope(scope => {
      let newVal, oldVal
      _.forEachRight(scope.$$watchers, (watcher) => {
        try {
          newVal = watcher.watchFn(scope)
          oldVal = watcher.last
          if (!scope.$$areEqual(newVal, oldVal, watcher.valueEq)) {
            scope.$root.$$lastDirtyWatch = watcher
            watcher.last = (watcher.valueEq ? _.cloneDeep(newVal) : newVal)
            watcher.listenerFn(newVal, (oldVal === initWatchFn ? newVal : oldVal), scope)
            dirty = true
          } else if (scope.$root.$$lastDirtyWatch === watcher) {
            continueLoop = false
              // lodash的foreach return false 就顺便中断了
            return false
          }
        } catch (e) {
          console.log(e)
        }
      })
      return continueLoop
    })
    return dirty
  }
  $$areEqual(newVal, oldVal, valueEq) {
    if (valueEq) {
      return _.isEqual(newVal, oldVal)
    } else {
      // handle NaN
      return newVal === oldVal || (_.isNaN(newVal) && _.isNaN(oldVal))
    }
  }
  $begainPhase(phase) {
    if (this.$$phase) {
      throw this.$$phase + 'already in progress'
    } else {
      this.$$phase = phase
    }
  }
  $clearPhase() {
    this.$$phase = null
  }
  $destroy() {
    this.$broadcast('$destroy')
    if (this.$parent) {
      const siblings = this.$parent.$$children
      const indexOfThis = siblings.indexOf(this)
      if (indexOfThis >= 0) {
        siblings.splice(indexOfThis, 1)
      }
    }
    this.$$watchers = null
    this.$$listeners = {}
  }
  $on(eventName,listener){
    let listeners = this.$$listeners[eventName]
    if (!listeners) {
      this.$$listeners[eventName] = listeners = []
    }
    listeners.push(listener)
    // deregister
    return ()=>{
      const index = listeners.indexOf(listener)
      if (index>=0) {
        //不用splice 防止循环的时候跳过一个，副作用 触发的时候再splice
        listeners[index] = null
      };
    }
  }
  $emit(eventName){
    let propagationStopped = false
    const otherArgument = Array.prototype.slice.call(arguments,1)
    const event = {
      name: eventName,
      targetScope: this,
      stopPropagation:()=>{
        propagationStopped = true
      },
      preventDefault:()=>{
        event.defaultPrevented = true
      }
    }
    const listenerArgs = [event].concat(otherArgument)

    let scope = this
    do{
      event.currentScope = scope
      scope.$$fireEventOnScope(eventName,listenerArgs)
      scope = scope.$parent
    }while(scope&&!propagationStopped)
    event.currentScope = null
    return event
    // return 
  }
  $broadcast(eventName){
    const otherArgument = Array.prototype.slice.call(arguments,1)
    const event = {
      name: eventName,
      targetScope: this,
      preventDefault:()=>{
        event.defaultPrevented = true
      }

    }
    const listenerArgs = [event].concat(otherArgument)
    this.$$everyScope(scope=>{
      event.currentScope = scope
      scope.$$fireEventOnScope(eventName,listenerArgs)
      return true
    })
    event.currentScope = null
    return event
  }
  $$fireEventOnScope(eventName,listenerArgs){
    const listeners = this.$$listeners[eventName]||[]
    let i = 0
    // 不用forEach 方便删除
    while(i<listeners.length){
      if (listeners[i]===null) {
        listeners.splice(i,1)
      }else{
        listeners[i].apply(null, listenerArgs)
        i++
      }
    }

    // _.forEach(listeners,(listener)=>{

    // })
    return event
  }
}
module.exports = Scope







