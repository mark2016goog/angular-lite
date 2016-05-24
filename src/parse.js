
'use strict'

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
			}else if(this.ch==="'"||this.ch==='"'){
        this.readString()
      }
      else{
				throw 'unexpect next character '+ this.ch
			}
		}
		return this.tokens
	}
  // 是不是数字
	isNumber(ch){
		return ch>='0'&&ch<='9'
	}
  isExpOperator(ch){
    return ch==='+'||ch==='-'||this.isNumber(ch)
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
  readString(){
    this.index++
    let string = ''
    while(this.index<this.text.length){
      let ch = this.text.charAt(this.index)
      if (ch==="'"||ch==='"') {
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
  // 获取下一个位置字符，判断.42这种，小数点后面是不是数字，是数字要补0
  peek(){
    return this.index<this.text.length-1?this.text.charAt(this.index+1):false
  }
}
// 抽象树生成a,+,b=>{oper:'+',left:{},right:{}}
class AST{
	constructor(lexer){
		this.lexer = lexer
	}
	ast(text){
		this.tokens = this.lexer.lex(text)
    return this.program()
	}
  program(){
    return {type:AST.Program, body:this.constant()}
  }
  constant(){
    return {type:AST.Literal,value:this.tokens[0].value}
  }
}
AST.Program ='Program'
AST.Literal ='Literal'
// 抽象树遍历 = 最后一步 scope.a+scope.b
class ASTCompiler{
	constructor(astBuilder){
		this.astBuilder = astBuilder
	}
	compile(text){
		let ast = this.astBuilder.ast(text)
    this.state = {body:[]}
    this.recurse(ast)
    // console.log(this.state)
    return new Function(this.state.body.join(''))
	}
  recurse(ast){
    switch(ast.type){
      case AST.Program:
        this.state.body.push('return ',this.recurse(ast.body),';')
        break
      case AST.Literal:
        return this.escape(ast.value)
    }
  }
  escape(value){
    if (_.isString(value)) {
      return "'"+value+"'"
    }else{
      return value
    }
  }
}

class Parser{
	constructor(lexer){
		this.lexer = lexer
		this.ast = new AST(this.lexer)
		this.astCompiler = new ASTCompiler(this.ast)
	}
	parse(text){
    // console.log(text)
		return this.astCompiler.compile(text)
	}
}

module.exports = parse
