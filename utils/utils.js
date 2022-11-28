const fs = require('fs')
// node 子进程执行命令
function exec(command, args, options) {
    const win32 = process.platform === 'win32';
  
    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
    return require('child_process').spawn(cmd, cmdArgs, options || {});
}

function isEmptyDir () {
    const localPath = process.cwd() 
    console.log('process.cwd', localPath)
	const fileList = fs.readdirSync(localPath)
	return !fileList.length
}

function isObject(o){
    return Object.prototype.toString.call(o) === '[object Object]'
}

// 命令行loading
function spinnerStart(msg, spinnerString = '|/-\\'){
    const Spinner = require('cli-spinner').Spinner;
    const spinner = new Spinner(msg + " %s ")
    spinner.setSpinnerString(spinnerString)
    spinner.start()
    return spinner
}

// 手动等待
function sleep(timeout = 1000) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

module.exports = {
    exec,
    isEmptyDir,
    isObject,
    sleep,
    spinnerStart
}