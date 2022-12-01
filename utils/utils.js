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
function rmDir(path) {
    new Promise(async (resolve) => {
      if (fs.existsSync(path)) {
        const dirs = [path];
        const files = await fs.readdirSync(path);
        files.forEach(async (file) => {
          const childPath = path + "/" + file;
        //   console.log(childPath)
          if (fs.statSync(childPath).isDirectory()) {
            dirs.push(childPath);
            await rmDir(childPath);
          } else {
            await fs.unlinkSync(childPath);
          }
        });

        console.log(dirs)
  
        dirs.forEach((fir) => fs.rmdirSync(fir));
  
        resolve();
      }
    });
  }

module.exports = {
    exec,
    isEmptyDir,
    isObject,
    sleep,
    spinnerStart,
    rmDir
}