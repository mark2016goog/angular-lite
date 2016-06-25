function $QProvider () {
  this.$get = ['$rootScope', function ($rootScope) {
    function scheduleProcessQueue (state) {
      // console.log(state)
      $rootScope.$evalAsync(() => {
        processQueue(state)
      })
    }
    function makePromise (val, resolved) {
      const d = new Deferred()
      if (resolved) {
        d.resolve(val)
      } else {
        d.reject(val)
      }
      return d.promise
    }
    function reject (rejection) {
      var d = new Deferred()
      d.reject(rejection)
      return d.promise
    }
    function when (value, callback, errBack, progressBack) {
      const d = new Deferred()
      d.resolve(value)
      return d.promise.then(callback, errBack, progressBack)
    }
    function all (promises) {
      const results = _.isArray(promises) ? [] : {}
      const d = new Deferred()
      let counter = 0
      _.forEach(promises, (promise, index) => {
        counter++
        when(promise).then(val => {
          counter--
          results[index] = val
          if (!counter) {
            d.resolve(results)
          }
        }, rejection => {
          d.reject(rejection)
        })
      })
      if (!counter) {
        d.resolve(results)
      }

      return d.promise
    }
    function processQueue (state) {
      const pending = state.pending
      pending.forEach((handler) => {
        // status1是resolve，2是reject
        const fn = handler[state.status]
        const defered = handler[0]
        // console.log(handler)
        try {
          if (_.isFunction(fn)) {
            defered.resolve(fn(state.val))
          } else if (state.status === 1) {
            defered.resolve(state.val)
          } else {
            defered.reject(state.val)
          }
        } catch (e) {
          defered.reject(e)
        }
      })
      state.pending.length = 0
    }
    class Promise {
      constructor () {
        this.$$state = {
          pending: []
        }
      }
      then (onFulfilled, onRejected, onProgress) {
        const result = new Deferred()
        // status1是resolve，2是reject
        this.$$state.pending.push([result, onFulfilled, onRejected, onProgress])
        if (this.$$state.status > 0) {
          scheduleProcessQueue(this.$$state)
        }
        return result.promise
      }
      catch (onRejected) {
        return this.then(null, onRejected)
      }
      finally (callback, progressBack) {
        return this.then(val => {
          const callbackVal = callback()
          if (callbackVal && callbackVal.then) {
            return callbackVal.then(() => val)
          }
          return val
        }, rejection => {
          const callbackVal = callback()
          if (callbackVal && callbackVal.then) {
            return callbackVal.then(() => {
              return makePromise(rejection, false)
            })
          } else {
            return makePromise(rejection, false)
          }
        }, progressBack)
      }
    }
    class Deferred {
      constructor () {
        this.promise = new Promise()
      }
      resolve (val) {
        if (this.promise.$$state.status) {
          return
        }
        if (val && _.isFunction(val.then)) {
          val.then(_.bind(this.resolve, this), _.bind(this.reject, this), _.bind(this.notify, this))
        // val.then(::this.resolve, ::this.reject,::this.notify)
        } else {
          this.promise.$$state.val = val
          this.promise.$$state.status = 1
          scheduleProcessQueue(this.promise.$$state)
        }
      }
      reject (val) {
        if (this.promise.$$state.status) {
          return
        }
        this.promise.$$state.val = val
        this.promise.$$state.status = 2
        scheduleProcessQueue(this.promise.$$state)
      }
      notify (progress) {
        const pending = this.promise.$$state.pending
        if (pending && pending.length && !this.promise.$$state.status) {
          $rootScope.$evalAsync(() => {
            _.forEach(pending, handlers => {
              const deferred = handlers[0]
              const progressBack = handlers[3]
              try {
                deferred.notify(_.isFunction(progressBack) ? progressBack(progress) : progress)
              } catch (e) {
                console.log(e)
              }
            })
          })
        }
      }
    }

    function defer () {
      return new Deferred()
    }
    return {
      defer,
      reject,
      when,
      all,
      resolve: when
    }
  }]
}
export { $QProvider }
