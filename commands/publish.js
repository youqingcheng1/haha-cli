const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { delDir } = require('../utils/utils')
const currentDir = process.cwd()
const log = require('../utils/log')
const { glob } = require('glob')

class PublistCommand {
  constructor(){
    this.templatePath = ''
    this.packageConfig = {}
    // 默认忽略文件
    this.ignores = ['node_modules/**','dist/**','dist-ssr/**','.bootstrap/**','.vscode/**','.DS_Store/**','.git/**']
    this.initTemplate()
  }

  async initTemplate(){
    await this.packageBuild()
    await this.createTemplateDir()
    await this.initPackage()
    await this.getALlCopyFile()
  }

  // 包构建
  async packageBuild(){
    const promptList = [
      { 
        type:'input',name:'packageName',default:'',message:'请输入包名称',
        validate: function (e) {
          const done = this.async()
          setTimeout(()=> { if(!e){ done('请输入包名称');return } return done(null, true) },0)
        }
      },
      {
        type: 'input',name:'version',message:'请输入版本号',
        validate: function (e) {
          const done = this.async()
          setTimeout(()=> { if(!e){ done('请输入版本号');return } return done(null, true) },0)
        }
      }
    ]
    const { packageName, version } = await inquirer.prompt(promptList)
    this.ignores.push(`_template_${version}_/**`)
    this.packageConfig.packageName = packageName
    this.packageConfig.version = version
  }

  // 创建文件夹
  async createTemplateDir(){
    const templateDir = `template_${this.packageConfig.version}_`
    this.templatePath = path.join(currentDir, templateDir)
    delDir(this.templatePath)
    try{
      fs.mkdirSync(templateDir)
      fs.mkdirSync(path.join(this.templatePath, 'template'))
    }catch(error){
      return Promise.reject(error)
    }
  }

  // 初始化package.json
  async initPackage (){
    execSync('npm init -y', {
      cwd: this.templatePath
    })
  }

  // 读取ignore 忽略之外的所有文件
  getALlCopyFile (){
    this.getIgnoreConfig()
    log.info('\n 正在导入模板....... \n')
    glob('**', {
      cwd: currentDir,
      dot: true, //不忽略.开头文件和目录,
      nodir: true,
      ignore: this.ignores
    }, (err, filesPath) => {
      console.log('glob',filesPath)
      filesPath.forEach(path => {
        const content = fs.readFileSync(path, 'utf8')
        this.fileWrite(path, content)
      })
    })
  }

  // 获取ignore配置信息
  getIgnoreConfig(){
    const ignoresConfigPath = path.join(currentDir, 'publish.ignore.js')
    if(fs.existsSync(ignoresConfigPath)){
      const configs = require(ignoresConfigPath)
      if(!Array.isArray(configs)){
        log.error('publish.ignore.js 配置文件导出需为 module.exports = []')
      } else {
        this.ignores = [...new Set(this.ignores.concat(configs))]
      }
    }
  }

  // 文件写入模板
  fileWrite(filePath, content){
    // parse 返回对象 /home/user/dir/file.txt 目录分割
    const fileObj = path.parse(filePath)
    const dirPath = path.join(this.templatePath, `/template/${fileObj.dir}`)
    const _filePath = path.join(this.templatePath, `/template/${filePath}`)
    this.mkdirDeep(dirPath)
  }

  // 文件夹递归创建
  mkdirDeepCreate(dirPath){
    console.log('dirPath',dirPath)
    if(fs.existsSync(dirPath)){
      return
    } else {
      fs.mkdirSync(dirPath)
    }
  }  

  mkdirDeep(dirname){
    console.log('dirname', dirname)
    if (!dirname) return true;
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (this.mkdirDeep(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  }
  
}

function publish(){
  return new PublistCommand()
}

module.exports = publish