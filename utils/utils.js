const fs = require('fs');
const { off } = require('process');
// node 子进程执行命令
function exec(command, args, options) {
    const win32 = process.platform === 'win32';
  
    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
    return require('child_process').spawn(cmd, cmdArgs, options || {});
}

// 当前目录是否为空
function isEmptyDir () {
    const localPath = process.cwd() 
	const fileList = fs.readdirSync(localPath)
	return !fileList.length
}

// 判断是否是对象
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

// 删除文件夹
function delDir(path){
  let files = [];
  if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file) => {
          let curPath = path + "/" + file;
          //判断是否是文件夹
          if(fs.statSync(curPath).isDirectory()){
              delDir(curPath); //递归删除文件夹
          } else {
              //文件的话，直接删除
              fs.unlinkSync(curPath); //删除文件
          }
      });
      fs.rmdirSync(path);
  }
}

module.exports = {
    exec,
    isEmptyDir,
    isObject,
    sleep,
    spinnerStart,
    delDir
}