'use strict'
// 其实用es6的map即可，这个代码纯玩

function hashKey(value){
  let type=typeof value
  let uid
  if (type ==='function' || (type==='object'&&value!==null)) {
    uid = value.$$hashKey
    if (uid===undefined) {
      uid = value.$$hashKey = _.uniqueId()
    }else if(typeof uid==='function'){
      uid = value.$$hashKey()
    }
  }else{
    uid = value
  }
  return type+':'+uid
}

class HashMap{
  constructor(){

  }
  put(key,val){
    this[hashKey(key)] = val
  }
  get(key){
    return this[hashKey(key)]
  }
  remove(key){
    key = hashKey(key)
    let val = this[key]
    delete this[key]
    return val
  }
}














export {hashKey,HashMap}