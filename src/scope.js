'use strict'


class Scope {
	constructor () {
		this.$$watchers = []
	}
	$watch (watchFn, listenerFn) {
		let watchers = {
			watchFn:watchFn,
			listenerFn:listenerFn
		}
		this.$$watchers.push(watchers)
	}
	$digest () {
		let newVal, oldVal
		this.$$watchers.forEach((watcher)=>{
			newVal = watcher.watchFn(this)
			oldVal = watcher.last
			if (newVal!==oldVal) {
				watcher.last = newVal
				watcher.listenerFn(newVal,oldVal,this)
			};
		})
	};

}
module.exports = Scope;