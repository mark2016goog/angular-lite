let Scope = require('../src/scope')
let _ = require('lodash')
describe('Scope', () => {
	let scope
	beforeEach(() => {
		scope = new Scope
	})

	it('should be uses as an object', () => {
		scope.aProperty = 1
		expect(scope.aProperty).toBe(1);
		scope.aProperty = 3
		expect(scope.aProperty).toBe(3);
	});
	it('digest can call listen function', () => {
		let watchFn = () => 'wat'
		let listenFn = jasmine.createSpy()
		scope.$watch(watchFn, listenFn)
		scope.$digest()
		expect(listenFn).toHaveBeenCalled()
			// expect(listenFn).toHaveBeenCalledWith(scope)
	})
	it('call the watch function with scope as argumetns', () => {
		let watchFn = jasmine.createSpy()
		let listenFn = () => {}
		scope.$watch(watchFn, listenFn)
		scope.$digest()
		expect(watchFn).toHaveBeenCalledWith(scope)

	})
	it('call the listen function when the watched value change', () => {
		scope.someValue = 'a'
		scope.counter = 0
		scope.$watch(scope => {
			return scope.someValue
		}, (newVal, oldVal, scope) => {
			scope.counter++
		})
		expect(scope.counter).toBe(0)
		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.someValue = 'b'
		expect(scope.counter).toBe(1)

		scope.$digest()
		expect(scope.counter).toBe(2)

	})
	it('call ths listener when watch value is first undefined', () => {
		scope.counter = 0
		scope.$watch(scope => scope.someValue, (newVal, oldVal, scope) => {
			scope.counter++
		})
		scope.$digest()
		expect(scope.counter).toBe(1)

	})
	it('call listener with new value as old value the first time',()=>{
		scope.someValue = 123
		let oldValueGiven
		scope.$watch(scope=>scope.someValue,(newVal,oldVal,scope)=>{
			oldValueGiven = oldVal
		})
		scope.$digest()
		expect(oldValueGiven).toBe(123)
	})
	it('may have watchers that omit the listen function ',()=>{
		let watchFn = jasmine.createSpy().and.returnValue('something')
		scope.$watch(watchFn)
		scope.$digest()
		expect(watchFn).toHaveBeenCalled()
	})

	it('triggers chained watchers in the same digest',()=>{
		scope.name = 'shengxinjing'
		scope.$watch(scope=>scope.nameUpper,(newVal,oldVal,scope)=>{
			if (newVal) {
				scope.initial = newVal.substring(0, 1)+'.'
			};

		})

		scope.$watch(scope=>scope.name,(newVal,oldVal,scope)=>{
			if (newVal) {
				scope.nameUpper = newVal.toUpperCase()
			};
		})
		scope.$digest()
		expect(scope.initial).toBe('S.')

		scope.name = 'woniu'
		scope.$digest()
		expect(scope.initial).toBe('W.')

	})
	it('gives up on the watches after 10 times',()=>{
		scope.countA = 0
		scope.countB = 0
		scope.$watch(scope=>scope.countA,(newVal,oldVal,scope)=>{
			scope.countB++
		})
		scope.$watch(scope=>scope.countB,(newVal,oldVal,scope)=>{
			scope.countA++
		})
		expect((function(){scope.$digest()})).toThrow()
	})
	it('ends the digest when the last watch id clean',()=>{
		scope.arr = _.range(100)
		let watchExecutions = 0

		_.times(100,(i)=>{
			scope.$watch((scope)=>{
				watchExecutions++
				return scope.arr[i]
			},(newVal,oldVal,scope)=>{

			})
		})
		scope.$digest()
		expect(watchExecutions).toBe(200)

		scope.arr[0] = 88
		scope.$digest()
		expect(watchExecutions).toBe(301)
	})
	it('does not end digest so that new watches are not run',()=>{
		scope.aValue = 'abc'
		scope.counter=0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
				scope.counter++
			})
		})
		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('compares based on value if enables',()=>{
		scope.aValue = [1,2,3]
		scope.counter = 0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		},true)

		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.aValue.push(4)
		scope.$digest()
		expect(scope.counter).toBe(2)
	})
	it('correctly handles NaNs',()=>{
		scope.number = 0/'aa'
		scope.counter = 0
		scope.$watch(scope=>scope.number,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)
	})

	it('execute $eval function and retuen results',()=>{
		scope.aValue = 2
		let result = scope.$eval(scope=>scope.aValue)
		expect(result).toBe(2)
	})
	it('passes the second $eval argument straight through',()=>{
		scope.aValue = 2
		let result = scope.$eval((scope,arg)=>{
			return scope.aValue+arg
		},2)
		expect(result).toBe(4)
	})

	it('executes apply function and starts the digest',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.$apply((scope)=>{
			scope.aValue = 'mushbroom'
		})
		expect(scope.counter).toBe(2)
	})

	it('execute $evalAsync function later in the same cycle',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluated = false
		scope.asyncEvaluatedImmediately = false

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.$evalAsync((scope)=>{
				scope.asyncEvaluated = true
			})
			scope.asyncEvaluatedImmediately = scope.asyncEvaluated
		})

		scope.$digest()
		expect(scope.asyncEvaluated).toBe(true)
		expect(scope.asyncEvaluatedImmediately).toBe(false)
	})

	it('execute $evalAsync function add by watch function ',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluated = false

		scope.$watch((scope)=>{
			if (!scope.asyncEvaluated) {
				scope.$evalAsync((scope)=>{
					scope.asyncEvaluated = true
				})
			};
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		scope.$digest()
		expect(scope.asyncEvaluated).toBe(true)
	})



	it('execute $evalAsync function even when not dirty ',()=>{
		scope.aValue = [1,2,3]
		scope.asyncEvaluatedTimes = 0

		scope.$watch((scope)=>{
			if (scope.asyncEvaluatedTimes<2) {
				scope.$evalAsync((scope)=>{
					scope.asyncEvaluatedTimes++
				})
			};
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		scope.$digest()
		expect(scope.asyncEvaluatedTimes).toBe(2)
	})
	it('eventually halts $evalAsync add by watchers ',()=>{
		scope.aValue = [1,2,3]

		scope.$watch((scope)=>{
			scope.$evalAsync((scope)=>{})
			return scope.aValue
		},(newVal,oldVal,scope)=>{})

		expect(()=>scope.$digest()).toThrow()
	})


	it('has a $$parse field whose value is the current digest phase',()=>{
		scope.aValue = [1,2,3]
		scope.phaseWatch = undefined
		scope.phaseListen = undefined
		scope.phaseApply = undefined

		scope.$watch(scope=>{
			scope.phaseWatch = scope.$$phase
		},(newval,oldval,scope)=>{
			scope.phaseListen = scope.$$phase			
		})

		scope.$apply(scope=>{
			scope.phaseApply = scope.$$phase			
		})
		expect(scope.phaseWatch).toBe('$digest')
		expect(scope.phaseListen).toBe('$digest')
		expect(scope.phaseApply).toBe('$apply')

	})

	it('schedules a digest in $evalAsync',(done)=>{
		scope.aValue = 'woniu'
		scope.counter = 0

		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$evalAsync(()=>{})
		expect(scope.counter).toBe(0)

		setTimeout(()=>{
			expect(scope.counter).toBe(1)
			done()
		},50)
	})
	it('allow asyn $apply with $applyAsync',(done)=>{
		scope.counter = 0
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.counter++
		})
		scope.$digest()
		expect(scope.counter).toBe(1)

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		expect(scope.counter).toBe(1)

		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)
	})
	it('never executes $applyAsync function in this same ciycle',(done)=>{
		scope.aValue = [1,2,3]
		scope.asyncApplied = false


		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{

			scope.$applyAsync(scope=>{
				scope.asyncApplied = true
			})
		})
		scope.$digest()
		expect(scope.asyncApplied).toBe(false)
		setTimeout(()=>{
			expect(scope.asyncApplied).toBe(true)
			done()
		},50)
	})
	it('coalesces many calss to $applyAsync',done=>{
		scope.counter = 0
		scope.$watch(scope=>{
			scope.counter++
			return scope.aValue	
		},(newVal,oldVal,scope)=>{
		})

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		scope.$applyAsync(scope=>{
			scope.aValue = 'mushbroom'
		})

		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)

	})

	it('cancels and flush $applyAsync if digested first',done=>{
		scope.counter = 0
		scope.$watch(scope=>{
			scope.counter++
			return scope.aValue	
		},(newVal,oldVal,scope)=>{
		})

		scope.$applyAsync(scope=>{
			scope.aValue = 'woniu'
		})
		scope.$applyAsync(scope=>{
			scope.aValue = 'mushbroom'
		})
		scope.$digest()
		expect(scope.counter).toBe(2)
		expect(scope.aValue).toBe('mushbroom')


		setTimeout(()=>{
			expect(scope.counter).toBe(2)
			done()
		},50)

	})

	it('runs a $$postDigest function after each digest',()=>{
		scope.counter = 0
		scope.$$postDigest(()=>{
			scope.counter++
		})
		expect(scope.counter).toBe(0)
		scope.$digest()
		expect(scope.counter).toBe(1)
		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('does not include $$postDigest in the digest',()=>{
		scope.aValue = 'woniu'
		scope.$$postDigest(()=>{
			scope.aValue = 'mushbroom'
		})
		scope.$watch(scope=>scope.aValue,(newVal,oldVal,scope)=>{
			scope.watcheValue = newVal
		})
		scope.$digest()
		expect(scope.watcheValue).toBe('woniu')
		// expect(scope.aValue).toBe('woniu')
		scope.$digest()
		expect(scope.watcheValue).toBe('mushbroom')
	})


	it('caches exception in watch function and continue',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			throw 'error'
		},(newVal,oldVal,scope)=>{})
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
	})
	it('caches exception in listener function and continue',()=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			throw 'error'
		})
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})

		scope.$digest()
		expect(scope.counter).toBe(1)
	})

	it('catch exception in $evalAsync',(done)=>{
		scope.aValue = 'woniu'
		scope.counter = 0
		scope.$watch(scope=>{
			return scope.aValue
		},(newVal,oldVal,scope)=>{
			scope.counter++
		})
		scope.$evalAsync(scope=>{
			throw 'evalAsync Error'
		})
		setTimeout(()=>{
			expect(scope.counter).toBe(1)
			done()
		})
	})

	it('catch exception in $applyAsync',(done)=>{

		scope.$applyAsync(scope=>{
			throw 'applyAsync Error'
		})
		scope.$applyAsync(scope=>{
			throw 'applyAsync Error'
		})
		scope.$applyAsync(scope=>{
			scope.applied = true
		})
		setTimeout(()=>{
			expect(scope.applied).toBe(true)
			done()
		})
	})

	it('catch exception in $postDigest',(done)=>{
		var didRun = false
		scope.$$postDigest(scope=>{
			throw 'postDigest Error'
		})
		scope.$$postDigest(scope=>{
			didRun = true
		})
		scope.$digest()
		expect(didRun).toBe(true)
	})













































});