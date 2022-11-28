'use strict';
const log = require('../utils/log')

// 命令基础对象
// 主要用于做参数的校验以及格式化
// 同过对象继承的方式来规范命令的实现
class Command {
  constructor(argv){
    // argv 为comman传入的参数
    if(!argv){
      throw new Error('参数不能为空')
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组！')
    }
    if (argv.length < 1) {
      throw new Error('参数列表为空！')
    }

    this._argv = argv
    let chain = Promise.resolve()
		chain = chain.then(() => this.initAtgs())
		chain = chain.then(() => this.init())
		chain = chain.then(() => this.exec())
		chain.catch(e => {
			log.error(e.message)
		})
  }

  initAtgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._options = this._argv[this._argv.length - 2]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }

  init() {
    throw new Error('init必须实现！');
  }

  exec() {
    throw new Error('exec必须实现！');
  }
}

module.exports = Command