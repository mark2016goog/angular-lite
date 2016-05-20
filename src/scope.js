'use strict'

function initWatchFn() {}

class Scope {
  constructor() {
    this.$$watchers = []
    this.$$lastDirtyWatch = null
    this.$$asyncQueue = []
  }
  $watch(watchFn, listenerFn, valueEq) {
    let watchers = {
      watchFn: watchFn,
      listenerFn: listenerFn || function() {},
      last: initWatchFn,
      valueEq:!!valueEq
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

    do {
      while(this.$$asyncQueue.length){
        let asyncTask = this.$$asyncQueue.shift()
        asyncTask.scope.$eval(asyncTask.expression)
      }
      dirty = this.$$digestOnce()
      if ((dirty||this.$$asyncQueue.length) && !(ttl--)) {
        throw '10 digest interations reached'
      };
    } while (dirty||this.$$asyncQueue.length)
  }
  $eval(fn,arg){
    return fn(this,arg)
  }
  $apply(fn){
    try{
      return this.$eval(fn)
    } finally{
      this.$digest()
    }
  }
  $evalAsync(fn){
    this.$$asyncQueue.push({
      scope:this,
      expression:fn
    })
  }
  $$digestOnce() {
    let newVal, oldVal, dirty
    _.forEach(this.$$watchers,(watcher) => {
      newVal = watcher.watchFn(this)
      oldVal = watcher.last
      if (!this.$$areEqual(newVal,oldVal,watcher.valueEq)) {
        this.$$lastDirtyWatch = watcher
        watcher.last = (watcher.valueEq?_.cloneDeep(newVal):newVal)
        watcher.listenerFn(newVal, (oldVal === initWatchFn ? newVal : oldVal), this)
        dirty = true
      }else if(this.$$lastDirtyWatch===watcher){
        //lodash的foreach return false 就顺便中断了
        return false
      }

    })
    return dirty
  }
  $$areEqual(newVal,oldVal,valueEq){
    if (valueEq) {
      return _.isEqual(newVal,oldVal)
    }else{
      //handle NaN
      return newVal===oldVal||(newVal!==newVal&&oldVal!==oldVal)
    }
  }

}
module.exports = Scope;