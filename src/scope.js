'use strict'


class Scope {
	constructor(){
		this.$$watchers = []
	}
	$watch(watchFn, listenerFn) {
		let watchers = {
			watchFn:watchFn,
			listenerFn:listenerFn
		}
		this.$$watchers.push(watchers)
	}
	$digest() {
		this.$$watchers.forEach((val)=>{
			val.listenerFn()
		})
	};

}
module.exports = Scope;