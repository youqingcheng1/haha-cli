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
	const fileList = fs.readdirSync(localPath)
	return !fileList.length
}

module.exports = {
    exec,
    isEmptyDir
}