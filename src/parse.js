
'use strict'

var ESCAPES = {
  'n': '\n',
  'f': '\f',
  'r': '\r',
  't': '\t',
  'v': '\v',
  '\'': '\'',
  '"': '"'
};
let parse = expr=>{
	let lexer = new Lexer()
	let parse = new Parser(lexer)
	return parse.parse(expr)
}
// 词法解析器a+b=> a,+,b
class Lexer{
	constructor(){

	}
  // 解析
	lex(text){
		this.text = text
		this.index = 0
		this.ch = undefined
		this.tokens = []
		while(this.index<this.text.length){
			this.ch = this.text.charAt(this.index)
			if (this.isNumber(this.ch)||(this.ch==='.'&&this.isNumber(this.peek()))) {
				this.readNumber()
				// console.log(this.tokens)
			}else if(this.is('\'"')){
        // 字符串
        this.readString(this.ch)
      }else if(this.isIdent(this.ch)){
        // 不是引号开头，是字母，或者_或者$,可能是变量，或者是true false null
        // 也有可能是object的key没有引号要加上引号处理
        this.readIdent()
      }else if(this.isWhiteSpace(this.ch)){
        // 空格忽略不计
        this.index++
      }else if(this.is('[]{}:,.')){
        this.tokens.push({
          text:this.ch
        })
        this.index++
      }else{
				throw 'unexpect next character '+ this.ch
			}
		}
    // console.log(this.tokens)
		return this.tokens
	}
  // 是不是数字
	isNumber(ch){
		return ch>='0'&&ch<='9'
	}
  isExpOperator(ch){
    return ch==='+'||ch==='-'||this.isNumber(ch)
  }
  isIdent(ch){
    return (ch>='a'&&ch<='z')||(ch>='A'&&ch<='Z')||ch==='_'||ch=='$'
  }
  isWhiteSpace(ch){
    return ch===' '||ch==='\r'||ch==='\t'||ch==='\n'||ch==='\v'||ch==='\u00A0'
  }
  is(chs){
    return chs.indexOf(this.ch)>=0
  }
  // 获取下一个位置字符，判断.42这种，小数点后面是不是数字，是数字要补0
  peek(){
    return this.index<this.text.length-1?this.text.charAt(this.index+1):false
  }
  // 挨个读取数字和小数点
	readNumber(){
		let number = ''
		while(this.index<this.text.length){

			let ch = this.text.charAt(this.index).toLowerCase()
			if (ch=='.'||this.isNumber(ch)) {
				number += ch
			}else{
				// break
        let nextCh = this.peek()
        let prevCh = number.charAt(number.length-1)
        // console.log(prevCh,ch,nextCh)
        if(ch==='e'&&this.isExpOperator(nextCh)){
          number += ch
        }else if(this.isExpOperator(ch)&&prevCh==='e'&&nextCh&&this.isNumber(nextCh)){
          number += ch
        }else if(this.isExpOperator(ch)&&prevCh==='e'&&(!nextCh||!this.isNumber(nextCh))){
          throw 'invalid exponent'
        }else{
          break
        }
			}
			this.index++
		}
		this.tokens.push({
			text:number,
			value:Number(number)
		})
	}
  // 读字符串
  readString(quote){
    this.index++
    let string = ''
    let escape = false
    // console.log(quote)
    while(this.index<this.text.length){
      let ch = this.text.charAt(this.index)
      // \\后面的字符，看是不是有转义
      if(escape){
        // \后面u开头的 是16进制编码，需要用fromCharCode解码
        if (ch==='u') {
          let hex = this.text.substring(this.index+1,this.index+5)
          if (!hex.match(/[\da-f]{4}/i)) {
            throw 'invalid unicode escape'
          };
          this.index+=4
          string+= String.fromCharCode(parseInt(hex,16))
        }else{
          let replacement = ESCAPES[ch]
          if (replacement) {
            string+=replacement
          }else{
            string+=ch
          }
        }
        escape = false
      }else if(ch==='\\'){
        escape = true
      }else if (ch===quote) {
        this.index++
        this.tokens.push({
          text:string,
          value:string
        })
        return 
      }else{  
        string+=ch
      }
      this.index++
    }
    throw 'unmathed quote'
  }
  readIdent(){
    let text = ''
    while(this.index<this.text.length){
      let ch = this.text.charAt(this.index)
      if (this.isIdent(ch)||this.isNumber(ch)) {
        text += ch
      }else{
        break
      }
      this.index++
    }
    this.tokens.push({text:text, identifier:true})
  }
}
// 抽象树生成a,+,b=>{oper:'+',left:{},right:{}}
class AST{
	constructor(lexer){
		this.lexer = lexer
    // 怎么给class的原型属性赋值 先写这里吧 
    this.constants = {
      'null':{type:AST.Literal,value:null},
      'true':{type:AST.Literal,value:true},
      'false':{type:AST.Literal,value:false},
      'this':{type:AST.ThisExpression},
    }

	}
	ast(text){
		this.tokens = this.lexer.lex(text)
    // console.log(JSON.stringify(this.tokens,null,2))

    return this.program()
	}
  program(){
    return {type:AST.Program, body:this.primary()}
  }
  primary(){
    let primary
    if(this.expect('[')){
      // console.log()
      primary = this.arrayDeclaration()
    }else if(this.expect('{')){
      primary = this.object()
    }else if (this.constants.hasOwnProperty(this.tokens[0].text)) {
      primary = this.constants[this.consume().text]
    }else if(this.peek().identifier){
      // console.log(123)
      primary = this.identifier()
    }else{
      primary = this.constant()
    }
    let next
    while(next=this.expect('.','[')){
      if (next.text=='[') {
        primary = {
          type:AST.MemberExpression,
          object:primary,
          property:this.primary(),
          computed:true
        }
        this.consume(']')
      }else{
        primary = {
          type:AST.MemberExpression,
          object:primary,
          property:this.identifier(),
          computed:false

        }

      }
    }
    return primary
  }
  object(){
    let properties = []
    if (!this.peek('}')) {
      do{
        let property = {type:AST.Property}
        if (this.peek().identifier) {
          property.key = this.identifier()
        }else{
          property.key = this.constant()
        }
        this.consume(':')
        property.value = this.primary()
        properties.push(property)
      }while(this.expect(','))
    };
    this.consume('}')
    return {type:AST.ObjectExpression,properties:properties}
  }
  // 描述array
  arrayDeclaration(){
    let elements = []
    if (!this.peek(']')) {
      do{
        elements.push(this.primary())
      }while(this.expect(','))
    };
    this.consume(']')
    return {type:AST.ArrayExpression,elements:elements}
  }
  consume(e){
    let token = this.expect(e)
    if (!token) {
      throw 'unexpect expecting'+e
    }
    return token
  }
  expect(e1,e2,e3,e4){
    // 
    let token = this.peek(e1,e2,e3,e4)
    if (token) {
      return this.tokens.shift()
    };
  }
  peek(e1,e2,e3,e4){
    // tokens第一个的text是e或者e不存在，就返回token第一个
    if (this.tokens.length>0) {
      let text = this.tokens[0].text
      if (text===e1||text===e2||text===e3||text===e4||(!e1&&!e2&&!e3&&!e4)) {
        return this.tokens[0]
      };
    };
  }
  constant(){
    return {type:AST.Literal,value:this.consume().value}
  }
  identifier(){
    return {type:AST.Identifier,name:this.consume().text}
  }
  // test存在才操作

}
AST.Program ='Program'
AST.Literal ='Literal'
AST.ArrayExpression ='ArrayExpression'
AST.ObjectExpression ='ObjectExpression'
AST.Property ='Property'
AST.Identifier = 'Identifier'
AST.ThisExpression = 'ThisExpression'
AST.MemberExpression = 'MemberExpression'
// 抽象树遍历 = 最后一步 scope.a+scope.b
class ASTCompiler{
	constructor(astBuilder){
		this.astBuilder = astBuilder
    // 怎么给class的原型属性赋值 先写这里吧 
    this.stringEscapeRegx = /[^ a-zA-Z0-9]/g
    // 返回函数字符串的参数 第一个参数scope fn(s,l){var v0,v1xxxxx}
    this.arguScope = 's'
    // 第二个参数 Locals
    this.arguLocals = 'l'
	}
	compile(text){
		let ast = this.astBuilder.ast(text)
    // console.log(JSON.stringify(ast,null,2))
    // vars需要用到的变量v0v1方便函数一开始就var定义好
    // vars一开始放一个，拼var a,b的时候就不用判断length了 偷个懒 囧
    this.state = {body:[],nextId:0,vars:['_test_var']}
    this.recurse(ast)
    // console.log(this.state.body)
    // console.log(new Function('obj',this.state.body.join('')).toString())
    // console.log(this.state.body.join(''))
    return new Function(this.arguScope,this.arguLocals ,'var '+this.state.vars.join(',')+';'+this.state.body.join(''))
	}
  recurse(ast){
    let varid
    switch(ast.type){

      case AST.Program:
        this.state.body.push('return ',this.recurse(ast.body),';')
        // console.log(this.state.body.join(''))
        break
      case AST.Literal:
        return this.escape(ast.value)
      case AST.ArrayExpression:
        let elements = _.map(ast.elements,element=>{
          return this.recurse(element)
        },this)
        // console.log(elements)
        return '['+elements.join(',')+']'
      case AST.ObjectExpression:
        let properties = _.map(ast.properties,property=>{

          let key =   property.key.type===AST.Identifier?
                      property.key.name:
                      this.escape(property.key.value)
          let value = this.recurse(property.value)
          return key+':'+value
        },this)
        return '{'+properties.join(',')+'}'
      case AST.Identifier:

      // 这么拼字符串
        // function anonymous(s, l) {
        //   var _test_var, v0;
        //   if (l && ('aKey' in l)) {
        //     v0 = (l).aKey;
        //   }
        //   if (!(l && ('aKey' in l)) && s) {
        //     v0 = (s).aKey;
        //   }
        //   return v0;
        // }
        varid = this.nextId()
        this._if(this.getHasOwnProperty(this.arguLocals,ast.name),
              this.assign(varid,this.nonComputedMember(this.arguLocals ,ast.name)))
        this._if(this.not(this.getHasOwnProperty(this.arguLocals,ast.name))+'&&'+this.arguScope,
              this.assign(varid,this.nonComputedMember(this.arguScope ,ast.name)))
        // console.log(this.nonComputedMember('obj',ast.name))
        return varid
      case AST.ThisExpression:
        // 如果是this 直接返回函数传递的参数
        return this.arguScope 
      case AST.MemberExpression:

        varid = this.nextId()
        let left = this.recurse(ast.object)

        if (ast.computed) {
          let right = this.recurse(ast.property)
          // console.log(this.ComputedMember(left ,right))
          this._if(left, this.assign(varid,this.ComputedMember(left ,right)))
        }else{
          this._if(left, this.assign(varid,this.nonComputedMember(left ,ast.property.name)))
        }
        // console.log(this.state.body)
        return varid
    }
  }
  nonComputedMember(left,right){
    return '('+left+').'+right
  }
  ComputedMember(left,right){
    return '('+left+')['+right+']'
  }
  assign(id,value){
    return id+'='+value+';'
  }
  nextId(){
    let vid = 'v'+(this.state.nextId++)
    this.state.vars.push(vid)
    return vid
  }
  escape(value){
    if (_.isString(value)) {
      return "\'"+value.replace(this.stringEscapeRegx,this.stringEscapeFn)+"\'"
    }else if(_.isNull(value)){
      return 'null'
    }else{
      return value
    }
  }
  _if(test,consequent){
    this.state.body.push('if('+test+'){'+consequent+'}')
  }
  not(e){
    return '!('+e+')'
  }
  getHasOwnProperty(object,property){
    return object+'&&('+this.escape(property)+' in '+object+')'
  }
  stringEscapeFn(c){
    // 16进制 比如 '变成\u0027 转译字符'a'b'就不会出错，变成'a\u0027b'
    // console.log(c,'\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4))
    return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4)
  }
}
// ASTCompiler.stringEscapeRegx = /[^a-zA-Z0-9]/g


class Parser{
	constructor(lexer){
		this.lexer = lexer
		this.ast = new AST(this.lexer)
		this.astCompiler = new ASTCompiler(this.ast)
	}
	parse(text){
    // return new Function('return '+text+';')
    // console.log(text)
		return this.astCompiler.compile(text)
	}
}

module.exports = parse
