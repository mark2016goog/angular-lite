let Scope = require('../src/scope')
let _ = require('lodash')
describe('Scope', () => {
	let scope
	beforeEach(() => {
		scope = new Scope()
	})
	describe('digest', () => {


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
		it('call listener with new value as old value the first time', () => {
			scope.someValue = 123
			let oldValueGiven
			scope.$watch(scope => scope.someValue, (newVal, oldVal, scope) => {
				oldValueGiven = oldVal
			})
			scope.$digest()
			expect(oldValueGiven).toBe(123)
		})
		it('may have watchers that omit the listen function ', () => {
			let watchFn = jasmine.createSpy().and.returnValue('something')
			scope.$watch(watchFn)
			scope.$digest()
			expect(watchFn).toHaveBeenCalled()
		})

		it('triggers chained watchers in the same digest', () => {
			scope.name = 'shengxinjing'
			scope.$watch(scope => scope.nameUpper, (newVal, oldVal, scope) => {
				if (newVal) {
					scope.initial = newVal.substring(0, 1) + '.'
				};

			})

			scope.$watch(scope => scope.name, (newVal, oldVal, scope) => {
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
		it('gives up on the watches after 10 times', () => {
			scope.countA = 0
			scope.countB = 0
			scope.$watch(scope => scope.countA, (newVal, oldVal, scope) => {
				scope.countB++
			})
			scope.$watch(scope => scope.countB, (newVal, oldVal, scope) => {
				scope.countA++
			})
			expect((function() {
				scope.$digest()
			})).toThrow()
		})
		it('ends the digest when the last watch id clean', () => {
			scope.arr = _.range(100)
			let watchExecutions = 0

			_.times(100, (i) => {
				scope.$watch((scope) => {
					watchExecutions++
					return scope.arr[i]
				}, (newVal, oldVal, scope) => {

				})
			})
			scope.$digest()
			expect(watchExecutions).toBe(200)

			scope.arr[0] = 88
			scope.$digest()
			expect(watchExecutions).toBe(301)
		})
		it('does not end digest so that new watches are not run', () => {
			scope.aValue = 'abc'
			scope.counter = 0
			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
					scope.counter++
				})
			})
			scope.$digest()
			expect(scope.counter).toBe(1)
		})
		it('compares based on value if enables', () => {
			scope.aValue = [1, 2, 3]
			scope.counter = 0
			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			}, true)

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.aValue.push(4)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('correctly handles NaNs', () => {
			scope.number = 0 / 'aa'
			scope.counter = 0
			scope.$watch(scope => scope.number, (newVal, oldVal, scope) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
			scope.$digest()
			expect(scope.counter).toBe(1)
		})

		it('execute $eval function and retuen results', () => {
			scope.aValue = 2
			let result = scope.$eval(scope => scope.aValue)
			expect(result).toBe(2)
		})
		it('passes the second $eval argument straight through', () => {
			scope.aValue = 2
			let result = scope.$eval((scope, arg) => {
				return scope.aValue + arg
			}, 2)
			expect(result).toBe(4)
		})

		it('executes apply function and starts the digest', () => {
			scope.aValue = 'woniu'
			scope.counter = 0

			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.$apply((scope) => {
				scope.aValue = 'mushbroom'
			})
			expect(scope.counter).toBe(2)
		})

		it('execute $evalAsync function later in the same cycle', () => {
			scope.aValue = [1, 2, 3]
			scope.asyncEvaluated = false
			scope.asyncEvaluatedImmediately = false

			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.$evalAsync((scope) => {
					scope.asyncEvaluated = true
				})
				scope.asyncEvaluatedImmediately = scope.asyncEvaluated
			})

			scope.$digest()
			expect(scope.asyncEvaluated).toBe(true)
			expect(scope.asyncEvaluatedImmediately).toBe(false)
		})

		it('execute $evalAsync function add by watch function ', () => {
			scope.aValue = [1, 2, 3]
			scope.asyncEvaluated = false

			scope.$watch((scope) => {
				if (!scope.asyncEvaluated) {
					scope.$evalAsync((scope) => {
						scope.asyncEvaluated = true
					})
				};
				return scope.aValue
			}, (newVal, oldVal, scope) => {})

			scope.$digest()
			expect(scope.asyncEvaluated).toBe(true)
		})



		it('execute $evalAsync function even when not dirty ', () => {
			scope.aValue = [1, 2, 3]
			scope.asyncEvaluatedTimes = 0

			scope.$watch((scope) => {
				if (scope.asyncEvaluatedTimes < 2) {
					scope.$evalAsync((scope) => {
						scope.asyncEvaluatedTimes++
					})
				};
				return scope.aValue
			}, (newVal, oldVal, scope) => {})

			scope.$digest()
			expect(scope.asyncEvaluatedTimes).toBe(2)
		})
		it('eventually halts $evalAsync add by watchers ', () => {
			scope.aValue = [1, 2, 3]

			scope.$watch((scope) => {
				scope.$evalAsync((scope) => {})
				return scope.aValue
			}, (newVal, oldVal, scope) => {})

			expect(() => scope.$digest()).toThrow()
		})


		it('has a $$parse field whose value is the current digest phase', () => {
			scope.aValue = [1, 2, 3]
			scope.phaseWatch = undefined
			scope.phaseListen = undefined
			scope.phaseApply = undefined

			scope.$watch(scope => {
				scope.phaseWatch = scope.$$phase
			}, (newval, oldval, scope) => {
				scope.phaseListen = scope.$$phase
			})

			scope.$apply(scope => {
				scope.phaseApply = scope.$$phase
			})
			expect(scope.phaseWatch).toBe('$digest')
			expect(scope.phaseListen).toBe('$digest')
			expect(scope.phaseApply).toBe('$apply')

		})

		it('schedules a digest in $evalAsync', (done) => {
			scope.aValue = 'woniu'
			scope.counter = 0

			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			scope.$evalAsync(() => {})
			expect(scope.counter).toBe(0)

			setTimeout(() => {
				expect(scope.counter).toBe(1)
				done()
			}, 50)
		})
		it('allow asyn $apply with $applyAsync', (done) => {
			scope.counter = 0
			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.$applyAsync(scope => {
				scope.aValue = 'woniu'
			})
			expect(scope.counter).toBe(1)

			setTimeout(() => {
				expect(scope.counter).toBe(2)
				done()
			}, 50)
		})
		it('never executes $applyAsync function in this same ciycle', (done) => {
			scope.aValue = [1, 2, 3]
			scope.asyncApplied = false


			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {

				scope.$applyAsync(scope => {
					scope.asyncApplied = true
				})
			})
			scope.$digest()
			expect(scope.asyncApplied).toBe(false)
			setTimeout(() => {
				expect(scope.asyncApplied).toBe(true)
				done()
			}, 50)
		})
		it('coalesces many calss to $applyAsync', done => {
			scope.counter = 0
			scope.$watch(scope => {
				scope.counter++
					return scope.aValue
			}, (newVal, oldVal, scope) => {})

			scope.$applyAsync(scope => {
				scope.aValue = 'woniu'
			})
			scope.$applyAsync(scope => {
				scope.aValue = 'mushbroom'
			})

			setTimeout(() => {
				expect(scope.counter).toBe(2)
				done()
			}, 50)

		})

		it('cancels and flush $applyAsync if digested first', done => {
			scope.counter = 0
			scope.$watch(scope => {
				scope.counter++
					return scope.aValue
			}, (newVal, oldVal, scope) => {})

			scope.$applyAsync(scope => {
				scope.aValue = 'woniu'
			})
			scope.$applyAsync(scope => {
				scope.aValue = 'mushbroom'
			})
			scope.$digest()
			expect(scope.counter).toBe(2)
			expect(scope.aValue).toBe('mushbroom')


			setTimeout(() => {
				expect(scope.counter).toBe(2)
				done()
			}, 50)

		})

		it('runs a $$postDigest function after each digest', () => {
			scope.counter = 0
			scope.$$postDigest(() => {
				scope.counter++
			})
			expect(scope.counter).toBe(0)
			scope.$digest()
			expect(scope.counter).toBe(1)
			scope.$digest()
			expect(scope.counter).toBe(1)
		})
		it('does not include $$postDigest in the digest', () => {
			scope.aValue = 'woniu'
			scope.$$postDigest(() => {
				scope.aValue = 'mushbroom'
			})
			scope.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.watcheValue = newVal
			})
			scope.$digest()
			expect(scope.watcheValue).toBe('woniu')
				// expect(scope.aValue).toBe('woniu')
			scope.$digest()
			expect(scope.watcheValue).toBe('mushbroom')
		})


		it('caches exception in watch function and continue', () => {
			scope.aValue = 'woniu'
			scope.counter = 0
			scope.$watch(scope => {
				throw 'error'
			}, (newVal, oldVal, scope) => {})
			scope.$watch(scope => {
				return scope.aValue
			}, (newVal, oldVal, scope) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
		})
		it('caches exception in listener function and continue', () => {
			scope.aValue = 'woniu'
			scope.counter = 0
			scope.$watch(scope => {
				return scope.aValue
			}, (newVal, oldVal, scope) => {
				throw 'error'
			})
			scope.$watch(scope => {
				return scope.aValue
			}, (newVal, oldVal, scope) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
		})

		it('catch exception in $evalAsync', (done) => {
			scope.aValue = 'woniu'
			scope.counter = 0
			scope.$watch(scope => {
				return scope.aValue
			}, (newVal, oldVal, scope) => {
				scope.counter++
			})
			scope.$evalAsync(scope => {
				throw 'evalAsync Error'
			})
			setTimeout(() => {
				expect(scope.counter).toBe(1)
				done()
			})
		})

		it('catch exception in $applyAsync', (done) => {

			scope.$applyAsync(scope => {
				throw 'applyAsync Error'
			})
			scope.$applyAsync(scope => {
				throw 'applyAsync Error'
			})
			scope.$applyAsync(scope => {
				scope.applied = true
			})
			setTimeout(() => {
				expect(scope.applied).toBe(true)
				done()
			})
		})

		it('catch exception in $postDigest', () => {
			var didRun = false
			scope.$$postDigest(() => {
				throw 'postDigest Error'
			})
			scope.$$postDigest(() => {
				didRun = true
			})
			scope.$digest()
			expect(didRun).toBe(true)


		})

		it('allow destroying a $watch with a removal function', () => {
			scope.aValue = 'woniu'
			scope.counter = 0

			let destroyWatch = scope.$watch(scope => scope.aValue, () => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.aValue = 'mushbroom'
			scope.$digest()
			expect(scope.counter).toBe(2)

			scope.aValue = 'test'
			destroyWatch()
			scope.$digest()
			expect(scope.counter).toBe(2)


		})

		it('allow destroy watcher during digest', () => {
			scope.aValue = 'woniu'
			var watchCalls = []
			scope.$watch(scope => {
				watchCalls.push('first')
				return scope.aValue
			})
			var destroyWatch = scope.$watch(scope => {
				watchCalls.push('second')
				destroyWatch()
			})
			scope.$watch(scope => {
				watchCalls.push('third')
				return scope.aValue
			})
			scope.$digest()
			expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third'])
		})

		it('allows a watch to destroy another during digest', () => {
			scope.aValue = 'woniu'
			scope.counter = 0
			scope.$watch(scope => scope.aValue, () => {
				destroyWatch()
			})
			var destroyWatch = scope.$watch(() => {}, () => {})
			scope.$watch(scope => scope.aValue, () => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
		})

	})

	describe('watchGroup', () => {
		let scope
		beforeEach(() => {
			scope = new Scope()
		})



		it('takes watches as an array and calls listener with arrays', () => {
			var gotNewVals, gotOldVals
			scope.aValue = 1
			scope.anotherValue = 2
			scope.$watchGroup([
				scope => scope.aValue,
				scope => scope.anotherValue
			], (newVals, oldVals, scope) => {
				gotNewVals = newVals
				gotOldVals = oldVals
			})
			scope.$digest()
			expect(gotNewVals).toEqual([1, 2])
			expect(gotOldVals).toEqual([1, 2])
		})


		it('only call listener once in one digest', () => {
			var counter = 0
			scope.aValue = 1
			scope.anotherValue = 2
			scope.$watchGroup([
				scope => scope.aValue,
				scope => scope.anotherValue
			], (newVals, oldVals, scope) => {
				counter++
			})
			scope.$digest()
			expect(counter).toBe(1)
		})

		it('use same array of new and old on first run', () => {
			var gotNewVals, gotOldVals
			scope.aValue = 1
			scope.anotherValue = 2
			scope.$watchGroup([
				scope => scope.aValue,
				scope => scope.anotherValue
			], (newVals, oldVals, scope) => {
				gotNewVals = newVals
				gotOldVals = oldVals
			})
			scope.$digest()
			expect(gotNewVals).toBe(gotOldVals)
		})

		it('use different array of new and old on subsequent run', () => {
			var gotNewVals, gotOldVals
			scope.aValue = 1
			scope.anotherValue = 2
			scope.$watchGroup([
				scope => scope.aValue,
				scope => scope.anotherValue
			], (newVals, oldVals, scope) => {
				gotNewVals = newVals
				gotOldVals = oldVals
			})
			scope.$digest()
			scope.anotherValue = 3
			scope.$digest()
			expect(gotNewVals).toEqual([1, 3])
			expect(gotOldVals).toEqual([1, 2])
		})
		it('call the listrner once when the watch array in empty', () => {
			var gotNewVals, gotOldVals
			scope.aValue = 1
			scope.anotherValue = 2
			scope.$watchGroup([], (newVals, oldVals, scope) => {
				gotNewVals = newVals
				gotOldVals = oldVals
			})
			scope.$digest()
			expect(gotNewVals).toEqual([])
			expect(gotOldVals).toEqual([])
		})

		it('watchGroupt can be deregisteed', () => {
			scope.counter = 0
			scope.aValue = 1
			scope.anotherValue = 2
			var destroyGroup = scope.$watchGroup([
				scope => scope.aValue,
				scope => scope.anotherValue
			], (newVals, oldVals, scope) => {
				scope.counter++
			})
			scope.$digest()
			scope.anotherValue = 3
			destroyGroup()
			scope.$digest()
			expect(scope.counter).toEqual(1)
		})

		it('does not call the zero-watch listener when deregistered first', () => {
			scope.counter = 0
			var destroyGroup = scope.$watchGroup([], (newVals, oldVals, scope) => {
				scope.counter++
			})
			destroyGroup()
			scope.$digest()
			expect(scope.counter).toEqual(0)
		})

	})

	describe('inheritance', () => {
		// let scope
		// beforeEach(() => {
		// 	scope = new Scope
		// })


		it('inherits the parent properties', () => {
			let parent = new Scope()
			parent.aValue = [1, 2, 3]
			let child = parent.$new()
			expect(child.aValue).toEqual([1, 2, 3])
		})
		it('does not cause a parent to inherit its properties', () => {
			let parent = new Scope()
			let child = parent.$new()
			child.aValue = [1, 2, 3]
			expect(parent.aValue).toBeUndefined()
		})
		it('inherits the parent properties whenever they are defined', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.aValue = [1, 2, 3]

			expect(child.aValue).toEqual([1, 2, 3])
		})
		it('can manipulate a paret scope property', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.aValue = [1, 2, 3]

			child.aValue.push(4)
			expect(parent.aValue).toEqual([1, 2, 3, 4])
			expect(child.aValue).toEqual([1, 2, 3, 4])

		})
		it('can watch a property in the parent', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.aValue = [1, 2, 3]
			child.counter = 0

			child.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			}, true)

			child.$digest()
			expect(child.counter).toBe(1)
			parent.aValue.push(4)
			child.$digest()
			expect(child.counter).toBe(2)
		})
		it('can be nested at any depth', () => {
			let test = new Scope()
			let test1 = test.$new()
			let test2 = test1.$new()
			let test22 = test1.$new()
			let test11 = test.$new()
			let test112 = test11.$new()

			test.aValue = 'mushbroom'
			expect(test1.aValue).toBe('mushbroom')
			expect(test2.aValue).toBe('mushbroom')
			expect(test22.aValue).toBe('mushbroom')
			expect(test11.aValue).toBe('mushbroom')
			expect(test112.aValue).toBe('mushbroom')
			test11.anotherValue = 'woniu'
			expect(test112.anotherValue).toBe('woniu')
			expect(test1.anotherValue).toBeUndefined()
			expect(test2.anotherValue).toBeUndefined()

			// expect(test1.aValue).toBe('mushbroom')
			// expect(test1.aValue).toBe('mushbroom')

		})
		it('shadows a parent property with the same name', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.name = 'woniu'
			child.name = 'mushbroom'
			expect(child.name).toBe('mushbroom')
			expect(parent.name).toBe('woniu')
		})
		it('does not shadows a parent property with object', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.user = {
				'name': 'woniu'
			}
			child.user.name = 'mushbroom'
			expect(child.user.name).toBe('mushbroom')
			expect(parent.user.name).toBe('mushbroom')
		})
		it('does not digest its parent', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.aValue = 'woniu'
			parent.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.aValueWas = newVal
			})

			child.$digest()
			expect(child.aValueWas).toBeUndefined()
		})
		it('keeps a record of its children', () => {
			let parent = new Scope()
			let child1 = parent.$new()
			let child2 = parent.$new()
			let child2_1 = child2.$new()

			expect(parent.$$children.length).toBe(2)
			expect(parent.$$children[0]).toBe(child1)
			expect(parent.$$children[1]).toBe(child2)
			expect(child1.$$children.length).toBe(0)
			expect(child2.$$children.length).toBe(1)
			expect(child2.$$children[0]).toBe(child2_1)

		})
		it('digests its children', () => {
			let parent = new Scope()
			let child = parent.$new()
			parent.aValue = 'woniu'
			child.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.aValueWas = newVal
			})

			parent.$digest()
			expect(child.aValueWas).toBe('woniu')
		})
		it('digests from root on $apply', () => {
			let parent = new Scope()
			let child = parent.$new()
			let child2 = child.$new()

			parent.aValue = 'woniu'
			parent.counter = 0
			parent.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			child2.$apply(() => {})
			expect(parent.counter).toBe(1)
		})
		it('schedules a digest from root on $evalAsync', (done) => {
			let parent = new Scope()
			let child = parent.$new()
			let child2 = child.$new()
			parent.aValue = 'woniu'
			parent.counter = 0
			parent.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			child2.$evalAsync(() => {})
			setTimeout(() => {
				expect(parent.counter).toBe(1)
				done()
			}, 50)

		})
		it('cannot watch parent attributes when isolated', () => {
			let parent = new Scope()
			let child = parent.$new(true)
			parent.aValue = 'woniu'
			child.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.aValueWas = newVal
			})

			child.$digest()
			expect(child.aValueWas).toBeUndefined()
		})
		it('digest  its isolated children', () => {
			let parent = new Scope()
			let child = parent.$new(true)
			child.aValue = 'woniu'
			child.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.aValueWas = newVal
			})

			parent.$digest()
			expect(child.aValueWas).toBe('woniu')
		})
		it('digests from root on $apply when isolated', () => {
			let parent = new Scope()
			let child = parent.$new(true)
			let child2 = child.$new()

			parent.aValue = 'woniu'
			parent.counter = 0
			parent.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			child2.$apply(() => {})

			expect(parent.counter).toBe(1)
		})
		it('schedules a digest from root on $evalAsync when isolated', (done) => {
			let parent = new Scope()
			let child = parent.$new(true)
			let child2 = child.$new()

			parent.aValue = 'woniu'
			parent.counter = 0
			parent.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			})

			child2.$evalAsync((scope) => {})
			setTimeout(() => {
				expect(parent.counter).toBe(1)
				done()
			}, 50)


		})

		it('executes $evalAsync functions on isolated scopes', (done) => {
			let parent = new Scope()
			let child = parent.$new(true)

			child.$evalAsync(scope => {
				scope.didEvalAsync = true
			})
			setTimeout(() => {
				expect(child.didEvalAsync).toBe(true)
				done()
			}, 50)

		})
		it('can take some other scope as the parent', () => {
			let prototyParent = new Scope()
			let hierarchyParent = new Scope()
			let child = prototyParent.$new(false, hierarchyParent)

			prototyParent.aValue = 42
			expect(child.aValue).toBe(42)

			child.counter = 0
			child.$watch(scope => {
				scope.counter++
			})

			prototyParent.$digest()
			expect(child.counter).toBe(0)

			hierarchyParent.$digest()
			expect(child.counter).toBe(2)


		})
		it('is no longer digestes when $destroy has been calles', () => {
			let parent = new Scope()
			let child = parent.$new()

			child.aValue = [1, 2, 3]
			child.counter = 0
			child.$watch(scope => scope.aValue, (newVal, oldVal, scope) => {
				scope.counter++
			}, true)

			parent.$digest()
			expect(child.counter).toBe(1)

			child.aValue.push(4)
			parent.$digest()
			expect(child.counter).toBe(2)

			child.$destroy()
			child.aValue.push(5)
			parent.$digest()
			expect(child.counter).toBe(2)

		})


	})
	describe('watchCollections', () => {
		let scope
		beforeEach(() => {
			scope = new Scope()
		})

		it('works like a normal for non-collections', () => {
			let valueProvided
			scope.aValue = 42
			scope.counter = 0
			scope.$watchCollection(scope => scope.aValue, (newVal) => {
				valueProvided = newVal
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
			expect(valueProvided).toBe(scope.aValue)

			scope.aValue = 43
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})

		it('notice when the value becomes an array', () => {
			scope.counter = 0
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arr = [1, 2, 3]
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('notice when the value added to an array', () => {
			scope.counter = 0
			scope.arr = [1, 2, 3]
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arr.push(4)
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('notice when the value removed to an array', () => {
			scope.counter = 0
			scope.arr = [1, 2, 3]
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arr.shift(4)
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})

		it('notice when the value replaced to an array', () => {
			scope.counter = 0
			scope.arr = [1, 2, 3]
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arr[0] = 4
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('notice when the value recorded to an array', () => {
			scope.counter = 0
			scope.arr = [2, 1, 3]
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arr.sort()
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})

		it('does note fail on NaNs in arrays', () => {
			scope.arr = [1, NaN, 3]
			scope.counter = 0
			scope.$watchCollection(scope => scope.arr, (newVal) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

		})
		it('notice an item replaced in an arrayLike arguments Object', () => {
			(() => {
				scope.arrayLike = arguments
			})(1, 2, 3)
			scope.counter = 0

			scope.$watchCollection(scope => scope.arrayLike, (newVal) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.arrayLike[0] = 42
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)

		})
		it('notice an item replaced in an arrayLike nodelist Object', () => {
			document.documentElement.appendChild(document.createElement('div'))
			scope.arrayLike = document.getElementsByTagName('div')
			scope.counter = 0

			scope.$watchCollection(scope => scope.arrayLike, (newVal) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			document.documentElement.appendChild(document.createElement('div'))
			scope.$digest()

			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)

		})

		it('notice when the value recorded to an object', () => {
			scope.counter = 0
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.obj = {
				'name': 'woniu'
			}
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})

		it('notice when a new attribute is added to an object', () => {
			scope.counter = 0
			scope.obj = {
				name: 'woniu'
			}
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.obj.girlfriend = 'mushbroom'
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('notice when attribute changed in an object', () => {
			scope.counter = 0
			scope.obj = {
				name: 'woniu'
			}
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.obj.name = 'mushbroom'
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('does not fail on NaN attributes in object', () => {
			scope.counter = 0
			scope.obj = {
				name: NaN
			}
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})

			scope.$digest()
			expect(scope.counter).toBe(1)
		})
		it('notice when attribute removed in an object', () => {
			scope.counter = 0
			scope.obj = {
				name: 'woniu',
				girlfriend: "mushbroom"
			}
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			delete scope.obj.name
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('does not consider any object with a length property an array', () => {
			scope.counter = 0
			scope.obj = {
				name: 'woniu',
				length: 1
			}
			scope.$watchCollection(scope => scope.obj, (newVal) => {
				scope.counter++
			})
			scope.$digest()
			expect(scope.counter).toBe(1)

			scope.obj.girlfriend = 'mushbroom'
			scope.$digest()
			expect(scope.counter).toBe(2)
			scope.$digest()
			expect(scope.counter).toBe(2)
		})
		it('gives the old non-collections values to listeners', () => {
			scope.aValue = 42
			let oldValueGiven

			scope.$watchCollection(scope => scope.aValue, (newVal, oldVal, scope) => {
				oldValueGiven = oldVal
			})
			scope.$digest()
			scope.aValue = 43
			scope.$digest()

			expect(oldValueGiven).toBe(42)
		})

		it('gives the old array values to listeners', () => {
			scope.aValue = [1, 2, 3]
			let oldValueGiven

			scope.$watchCollection(scope => scope.aValue, (newVal, oldVal, scope) => {
				oldValueGiven = oldVal
			})
			scope.$digest()
			scope.aValue.push(4)
			scope.$digest()

			expect(oldValueGiven).toEqual([1, 2, 3])
		})
		it('gives the old object values to listeners', () => {
			scope.aValue = {
				a: 1,
				b: 2
			}
			let oldValueGiven

			scope.$watchCollection(scope => scope.aValue, (newVal, oldVal, scope) => {
				oldValueGiven = oldVal
			})
			scope.$digest()
			scope.aValue.c = 43
			scope.$digest()

			expect(oldValueGiven).toEqual({
				a: 1,
				b: 2
			})
		})
		it('use the new value as the old val in the first run', () => {
			scope.aValue = {
				a: 1,
				b: 2
			}
			let oldValueGiven

			scope.$watchCollection(scope => scope.aValue, (newVal, oldVal, scope) => {
				oldValueGiven = oldVal
			})
			scope.$digest()
			expect(oldValueGiven).toEqual({
				a: 1,
				b: 2
			})
		})

	})

	describe('Events', () => {
		let parent, scope, child, isolatedChild

		beforeEach(() => {
			parent = new Scope()
			scope = parent.$new()
			child = scope.$new()
			isolatedChild = scope.$new(true)
		})

		it('allow to register listeners', () => {
			let listener1 = () => {}
			let listener2 = () => {}
			let listener3 = () => {}

			scope.$on('someEvent', listener1)
			scope.$on('someEvent', listener2)
			scope.$on('someOtherEvent', listener3)

			expect(scope.$$listeners).toEqual({
				someEvent: [listener1, listener2],
				someOtherEvent: [listener3]
			})
		})
		it('register different listeners for every scope', () => {
			let listener1 = () => {}
			let listener2 = () => {}
			let listener3 = () => {}

			scope.$on('someEvent', listener1)
			child.$on('someEvent', listener2)
			isolatedChild.$on('someEvent', listener3)

			expect(scope.$$listeners).toEqual({
				someEvent: [listener1]
			})
			expect(child.$$listeners).toEqual({
				someEvent: [listener2]
			})
			expect(isolatedChild.$$listeners).toEqual({
				someEvent: [listener3]
			})
		})

		_.forEach(['$emit', '$broadcast'], method => {
			it('calls the listener of matching event on ' + method, () => {
				let listener1 = jasmine.createSpy()
				let listener2 = jasmine.createSpy()
				scope.$on('someEvent', listener1)
				scope.$on('someOtherEvent', listener2)
				scope[method]('someEvent')

				expect(listener1).toHaveBeenCalled()
				expect(listener2).not.toHaveBeenCalled()
			})

			it('pass an event objet with a name to listeners on ' + method, () => {
				let listener = jasmine.createSpy()
				scope.$on('someEvent', listener)
				scope[method]('someEvent')

				expect(listener).toHaveBeenCalled()
				expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent')
			})

			it('pass the same event object to each listener on ' + method, () => {
				let listener1 = jasmine.createSpy()
				let listener2 = jasmine.createSpy()
				scope.$on('someEvent', listener1)
				scope.$on('someEvent', listener2)
				scope[method]('someEvent')

				const event1 = listener1.calls.mostRecent().args[0]
				const event2 = listener2.calls.mostRecent().args[0]
				expect(event1).toBe(event2)
			})

			it('pass additional arguments to listeners on ' + method, () => {
				let listener = jasmine.createSpy()
				scope.$on('someEvent', listener)
				scope[method]('someEvent', 'and', ['woniu', 'mushbroom'], '...')

				expect(listener).toHaveBeenCalled()
				expect(listener.calls.mostRecent().args[1]).toEqual('and')
				expect(listener.calls.mostRecent().args[2]).toEqual(['woniu', 'mushbroom'])
				expect(listener.calls.mostRecent().args[3]).toEqual('...')
				expect(listener.calls.mostRecent().args[4]).toBeUndefined()
			})
			it('returns the event object on ' + method, () => {

				let returnedEvent = scope[method]('someEvent')

				expect(returnedEvent).toBeDefined()
				expect(returnedEvent.name).toEqual('someEvent')
			})
			it('it can be deregistered on ' + method, () => {
				let listener = jasmine.createSpy()
				let deregister = scope.$on('someEvent', listener)
				deregister()

				scope[method]('someEvent')
				expect(listener).not.toHaveBeenCalled()
			})

			it('does not skip the next listener when removed on ' + method, () => {
				let deregister
				let listener = () => {
					deregister()
				}
				let nextListener = jasmine.createSpy()

				deregister = scope.$on('someEvent', listener)
				scope.$on('someEvent', nextListener)
				scope[method]('someEvent')

				expect(nextListener).toHaveBeenCalled()
			})

		})

		it('propagates up the scope hiearchy on $emit', () => {
			let parentlistener = jasmine.createSpy()
			let scopelistener = jasmine.createSpy()

			parent.$on('someEvent', parentlistener)
			scope.$on('someEvent', scopelistener)
			scope.$emit('someEvent')

			expect(parentlistener).toHaveBeenCalled()
			expect(scopelistener).toHaveBeenCalled()
		})
		it('propagates down the scope hiearchy on $broadcast', () => {
			let childlistener = jasmine.createSpy()
			let scopelistener = jasmine.createSpy()
			let isolatedChildListener = jasmine.createSpy()

			scope.$on('someEvent', scopelistener)
			child.$on('someEvent', childlistener)
			isolatedChild.$on('someEvent', scopelistener)
			scope.$broadcast('someEvent')

			expect(childlistener).toHaveBeenCalled()
			expect(scopelistener).toHaveBeenCalled()
			expect(isolatedChildListener).not.toHaveBeenCalled()
		})

		it('attaches targetScope on $emit', () => {
			let parentlistener = jasmine.createSpy()
			let scopelistener = jasmine.createSpy()
			scope.$on('someEvent', scopelistener)
			parent.$on('someEvent', parentlistener)

			scope.$emit('someEvent')
			expect(scopelistener.calls.mostRecent().args[0].targetScope).toBe(scope)
			expect(parentlistener.calls.mostRecent().args[0].targetScope).toBe(scope)
		})
		it('attaches targetScope on $broadcast', () => {
			let childlistener = jasmine.createSpy()
			let scopelistener = jasmine.createSpy()
			scope.$on('someEvent', scopelistener)
			child.$on('someEvent', childlistener)

			scope.$broadcast('someEvent')
			expect(scopelistener.calls.mostRecent().args[0].targetScope).toBe(scope)
			expect(childlistener.calls.mostRecent().args[0].targetScope).toBe(scope)
		})
		it('attaches currentScope on $emit', () => {
			let currentScopeOnScope, currentScopeOnParent
			let parentlistener = event => {
				currentScopeOnParent = event.currentScope
			}
			let scopelistener = event => {
				currentScopeOnScope = event.currentScope
			}
			scope.$on('someEvent', scopelistener)
			parent.$on('someEvent', parentlistener)

			scope.$emit('someEvent')
			expect(currentScopeOnScope).toBe(scope)
			expect(currentScopeOnParent).toBe(parent)
		})
		it('attaches currentScope on $broadcast', () => {
			let currentScopeOnScope, currentScopeOnChild
			let childlistener = event => {
				currentScopeOnChild = event.currentScope
			}
			let scopelistener = event => {
				currentScopeOnScope = event.currentScope
			}
			scope.$on('someEvent', scopelistener)
			child.$on('someEvent', childlistener)

			scope.$broadcast('someEvent')
			expect(currentScopeOnScope).toBe(scope)
			expect(currentScopeOnChild).toBe(child)

		})

		it('does not propagate to parents when stopped', () => {
			let scopelistener = event => {
				event.stopPropagation()
			}
			let parentlistener = jasmine.createSpy()
			scope.$on('someEvent', scopelistener)
			parent.$on('someEvent', parentlistener)

			scope.$emit('someEvent')
			expect(parentlistener).not.toHaveBeenCalled()

		})



		it('receive by listeners on current scope after being stopped', () => {
			let listener1 = event => {
				event.stopPropagation()
			}
			let listener2 = jasmine.createSpy()
			scope.$on('someEvent', listener1)
			scope.$on('someEvent', listener2)

			scope.$emit('someEvent')
			expect(listener2).toHaveBeenCalled()

		})

		_.forEach(['$emit', '$broadcast'], method => {
			it('is sets defaultPrevented when preventDefault called on ' + method, () => {
				let listener = event => {
					event.preventDefault()
				}
				scope.$on('someEvent', listener)
				let event = scope[method]('someEvent')
				expect(event.defaultPrevented).toBe(true)
			})
		})

		it('filres $destroy when destroyed', () => {
			let listener = jasmine.createSpy()
			scope.$on('$destroy', listener)
			scope.$destroy()

			expect(listener).toHaveBeenCalled()
		})
		it('filres $destroy when children destroyed', () => {
			let listener = jasmine.createSpy()
			child.$on('$destroy', listener)
			scope.$destroy()

			expect(listener).toHaveBeenCalled()
		})
		it('nolonger calls listeners after destroyed', () => {
			let listener = jasmine.createSpy()
			scope.$on('myEvent', listener)
			scope.$destroy()
			scope.$emit('myEvent')
			expect(listener).not.toHaveBeenCalled()
		})

	})


	describe('结合scope和parse', () => {
		it('可以watch表达式了', () => {
			let theValue
			scope.aValue = 42
			scope.$watch('aValue', (newVal, oldVal, scope) => {
				theValue = newVal
			})
			scope.$digest()

			expect(theValue).toBe(42)
		})

		it('可以watchCollection表达式了', function() {
			var theValue;
			scope.aColl = [1, 2, 3];
			scope.$watchCollection('aColl', function(newValue, oldValue, scope) {
				theValue = newValue;
			});
			scope.$digest();
			expect(theValue).toEqual([1, 2, 3]);
		});
		it('$eval支持表达式', function() {
			expect(scope.$eval('42')).toBe(42);
		});

		it('$apply支持表达式', function() {
			scope.aFunction = _.constant(42);
			expect(scope.$apply('aFunction()')).toBe(42);
		});
		it('$evalAsync 支持表达式', function(done) {
			var called;
			scope.aFunction = function() {
				called = true;
			};
			scope.$evalAsync('aFunction()');
			scope.$$postDigest(function() {
				expect(called).toBe(true);
				done();
			});
		});

		it('监听静态constant类型的数据，一次后就清空了，因为不会变', function() {
			scope.$watch('[1, 2, 3]', function() {});
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});

		it('::开头的变量，是单次绑定', function() {
			var theValue;
			scope.aValue = 42;
			scope.$watch('::aValue', function(newValue, oldValue, scope) {
				theValue = newValue;
			});
			scope.$digest();
			expect(theValue).toBe(42);
		});
		it('单次绑定结束，就结束了', function() {
			scope.aValue = 42;
			scope.$watch('::aValue', function() {});
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});
		it('监听的值不是undefined的时候才移出', function() {
			scope.$watch('::aValue', function() {});
			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);
			scope.aValue = 42;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});
		it('单次绑定的必须稳定后才移出', function() {
			scope.aValue = 42;
			scope.$watch('::aValue', function() {});
			var unwatchDeleter = scope.$watch('aValue', function() {
				delete scope.aValue;
			});
			scope.$digest();
			expect(scope.$$watchers.length).toBe(2);
			scope.aValue = 42;
			unwatchDeleter();
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});
		it('单次绑定复杂的数据结构--数组，所有的值都定义后才能移出', function() {
			scope.$watch('::[1, 2, aValue]', function() {}, true);
			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);
			scope.aValue = 3;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});
		it('单次绑定复杂的数据结构--对象，所有的值都定义后才能移出', function() {
			scope.$watch('::{a: 1, b: aValue}', function() {}, true);
			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);
			scope.aValue = 3;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});















	})



});