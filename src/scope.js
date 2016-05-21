'use strict'

function initWatchFn() {}

class Scope {
  constructor() {
    this.$$watchers = []
    this.$$lastDirtyWatch = null
      // $evalasync队列
    this.$$asyncQueue = []
    this.$$applyAsyncQueue = []
    this.$$postDigestQueue = []
    this.$$applyAsyncId = null
    this.$$phase = null
  }
  $watch(watchFn, listenerFn, valueEq) {
    let watchers = {
      watchFn: watchFn,
      listenerFn: listenerFn || function() {},
      last: initWatchFn,
      valueEq: !!valueEq
    }
    this.$$watchers.push(watchers)
    this.$$lastDirtyWatch = null
  }
  $digest() {
    let dirty
      //十次都不稳定，就报错
    let ttl = 10
      //记录上次dirty的watch
    this.$$lastDirtyWatch = null
      //用$$phase记录状态
    this.$begainPhase('$digest')

    if (this.$$applyAsyncId) {
      clearTimeout(this.$$applyAsyncId)
      this.$$flushApplyAsync()
    };
    do {
      while (this.$$asyncQueue.length) {
        let asyncTask = this.$$asyncQueue.shift()
        try{
          asyncTask.scope.$eval(asyncTask.expression)
        }catch(e){
          console.log(e)
        }

      }
      dirty = this.$$digestOnce()
      if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
        throw '10 digest interations reached'
      };
    } while (dirty || this.$$asyncQueue.length)
    this.$clearPhase()

    while (this.$$postDigestQueue.length) {
      try{
        this.$$postDigestQueue.shift()()
      }catch(e){
        console.log(e)
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
      this.$digest()
    }
  }
  $evalAsync(fn) {
    if (!this.$$phase && !this.$$asyncQueue.length) {
      setTimeout(() => {
        if (this.$$asyncQueue.length) {
          this.$digest()
        };
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
    if (this.$$applyAsyncId === null) {
      this.$$applyAsyncId = setTimeout(() => {
        this.$apply(() => {
            this.$$flushApplyAsync()
          })
          // this.$apply(_.bind(this.$$flushApplyAsync,this))
      }, 0)
    };

  }
  $$flushApplyAsync() {
    while (this.$$applyAsyncQueue.length) {
      try{
        this.$$applyAsyncQueue.shift()()

      }catch(e){
        console.log(e)
      }
    }
    this.$$applyAsyncId = null
  }
  $$postDigest(fn) {
    this.$$postDigestQueue.push(fn)
  }
  $$digestOnce() {
    let newVal, oldVal, dirty
    _.forEach(this.$$watchers, (watcher) => {

      try {
        newVal = watcher.watchFn(this)
        oldVal = watcher.last
        if (!this.$$areEqual(newVal, oldVal, watcher.valueEq)) {
          this.$$lastDirtyWatch = watcher
          watcher.last = (watcher.valueEq ? _.cloneDeep(newVal) : newVal)
          watcher.listenerFn(newVal, (oldVal === initWatchFn ? newVal : oldVal), this)
          dirty = true
        } else if (this.$$lastDirtyWatch === watcher) {
          //lodash的foreach return false 就顺便中断了
          return false
        }

      }catch(e) {
        console.log(e)
      }

    })
    return dirty
  }
  $$areEqual(newVal, oldVal, valueEq) {
    if (valueEq) {
      return _.isEqual(newVal, oldVal)
    } else {
      //handle NaN
      return newVal === oldVal || (newVal !== newVal && oldVal !== oldVal)
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
}
module.exports = Scope;