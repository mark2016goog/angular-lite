function $QProvider () {
  this.$get = ['$rootScope', function ($rootScope) {
    function scheduleProcessQueue (state) {
      // console.log(state)
      $rootScope.$evalAsync(() => {
        processQueue(state)
      })
    }

    function processQueue (state) {
      let pending = state.pending
      pending.forEach((handler) => {
        // status1是resolve，2是reject
        let fn = handler[state.status]
        let defered = handler[0]
        // console.log(handler)
        try {
          if (_.isFunction(fn)) {
            defered.resolve(fn(state.val))
          } else if (state.status == 1) {
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
      then (onFulfilled, onRejected) {
        let result = new Deferred()
        // status1是resolve，2是reject
        this.$$state.pending.push([result, onFulfilled, onRejected])
        if (this.$$state.status > 0) {
          scheduleProcessQueue(this.$$state)
        }
        return result.promise
      }
      catch (onRejected) {
        return this.then(null, onRejected)
      }
      finally (callback) {
        return this.then(() => callback(), () => callback())
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
        this.promise.$$state.val = val
        this.promise.$$state.status = 1
        scheduleProcessQueue(this.promise.$$state)
      }
      reject (val) {
        if (this.promise.$$state.status) {
          return
        }
        this.promise.$$state.val = val
        this.promise.$$state.status = 2
        scheduleProcessQueue(this.promise.$$state)
      }

    }

    function defer () {
      return new Deferred()
    }
    return {
      defer: defer
    }
  }]
}
export { $QProvider }
