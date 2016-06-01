# myAngular
学习 es6 webpack karma jasmine 给angular造个轮子

## 依赖

* 工具函数依赖lodash 后续考虑自己实现一个Lodash-lite
* dom操作依赖jquery 后续考虑自己实现一个jquery-lite

## 语法
* 使用es6尽可能多的语法
    - 变量解构赋值
    - class定义类，但是好像没法给原型赋属性
    - 箭头函数，告别this=self
    - ...arg代替apply，以及函数参数
    - 合并数组 [...arr1, ...arr2, ...arr3]
    - 用::和...args代替apply
    - 

## 测试
* karma+jasmine

## 规范

* 使用jslint 具体规范没选好，会用vue或者airbnb的编码规范

## 工程化
* webpack

* 打包现在用的webpack 后续用rollup吧 都说这个号
* envify:和ugify一起用，移除所有的调试代码和详细的错误信息,以此来提升效率并缩减文件

争取把上面出现的词，都搞透彻，也不枉我花时间造轮子了

> 参考build your own angularjs
