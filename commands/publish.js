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
    this.packageConfig = {
      packageName:'',
      packageVersion:'',
      temPkgBuild:[],
      sourcePkg:[],
    }
    // 默认忽略文件
    this.ignores = ['node_modules/**','dist/**','dist-ssr/**','.bootstrap/**','.vscode/**','.DS_Store/**','.git/**']
    this.initTemplate()
  }

  async initTemplate(){
    this.pkgBaseInfo()
    await this.packageBuild()
    await this.createTemplateDir()
    this.initPackage()
    this.rewritePackageInfo()
    this.getALlCopyFile()
    await this.isPublish()
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
        type: 'input',name:'version',message:'请输入包版本号',
        validate: function (e) {
          const done = this.async()
          setTimeout(()=> { if(!e){ done('请输入包版本号');return } return done(null, true) },0)
        }
      },
      {
        type: 'input',name:'descript',message:'请输入包描述',
        validate: function (e) {
          const done = this.async()
          setTimeout(()=> { if(!e){ done('请输入包描述');return } return done(null, true) },0)
        }
      },
    ]
    const { packageName, version, descript } = await inquirer.prompt(promptList)
    this.packageConfig.packageName = packageName
    this.packageConfig.packageVersion = version
    this.packageConfig.packageDescript = descript

    log.success('\n 录入包信息成功... \n')
  }

  // 创建文件夹
  async createTemplateDir(){
    const templateDir = `_template_${this.packageConfig.packageVersion}_`
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
    await execSync('npm init -y', {
      cwd: this.templatePath
    })
  }

  // 读取ignore 忽略之外的所有文件
  getALlCopyFile (){
    this.getIgnoreConfig()
   glob('**', {
      cwd: currentDir,
      dot: true, //不忽略.开头文件和目录,
      nodir: true,
      ignore: this.ignores
    }, (err, filesPath) => {
      filesPath.forEach(path => {
        this.fileWrite(path)
      })
    })
  }

  // 获取ignore配置信息
  getIgnoreConfig(){
    this.pkgBaseInfo()
    this.ignores.push(...this.packageConfig.temPkgBuild)
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
  async fileWrite(filePath){
    // parse 返回对象 /home/user/dir/file.txt 目录分割
    const fileObj = path.parse(filePath)
    const dirPath = path.join(this.templatePath, `/template/${fileObj.dir}`)
    const newPath = path.join(this.templatePath, `/template/${filePath}`)
    this.mkdirDeepCreate(dirPath)
    const content = fs.readFileSync(filePath, 'utf8')
    fs.writeFileSync(newPath, content)

    this.rewriteEjsRenderVar()
  } 

  // 文件夹深度递归创建
  mkdirDeepCreate(dirname){
    if (!dirname) return true;
    if (fs.existsSync(dirname)) {
      return true
    } else {
      // dirname 返回目录名 /foo/bar/baz/asdf =〉 /foo/bar/baz
      if (this.mkdirDeepCreate(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  }

  // 重新需要配置ejs渲染的变量
  async rewriteEjsRenderVar(){
    const templatePkgPath = path.join(this.templatePath, `template/${this.packageConfig.sourcePkg[0]}/package.json`)
    if(fs.existsSync(templatePkgPath)){
      let templatePkgInfo = require(templatePkgPath)
      templatePkgInfo.name = '<%= projectName %>'
      templatePkgInfo.version = '<%= projectVersion %>'
      templatePkgInfo.description = '<%= projectVersion %>'
      fs.writeFileSync(templatePkgPath, JSON.stringify(templatePkgInfo, null, '\t'))
    }
  }

  // 重新写入package.json
  rewritePackageInfo(){
    const packagePath = path.join(this.templatePath, 'package.json')
    const packageInfo = require(packagePath)
    packageInfo.name = this.packageConfig.packageName
    packageInfo.version = this.packageConfig.packageVersion
    packageInfo.description = this.packageConfig.packageDescript
    fs.writeFileSync(packagePath, JSON.stringify(packageInfo, null, '\t'))

    log.success('\n 创建template包成功 !!! \n')
  }

  // 判断有多少打包生成的包，以及原始包
  pkgBaseInfo(){
    const fsPkgList = fs.readdirSync(currentDir)
    fsPkgList.forEach(i => {
      if(/\_template_/.test(i)){
        const file = `${i}/**`
        !this.packageConfig.temPkgBuild.includes(file) && this.packageConfig.temPkgBuild.push(file)
      } else {
        this.packageConfig.sourcePkg.push(i)
      }
    })
    if(this.packageConfig.sourcePkg >1 ){
      log.error('模板包源只能存在一个！')
    }
  }

  //是否发布
  async isPublish () {
    const { isPublish } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isPublish',
        message: '是否发布至npm库？'
      }
    ])
    if (isPublish) {
      this.publishToNpm()
    } else {
      process.exit(0)
    }
  }

  publishToNpm () {
    execSync('npm publish', {
      cwd: this.templatePath
    })
    log.success(`\n发布成功!!!!!!\n`)
    process.exit(0)
  }
}

function publish(){
  return new PublistCommand()
}

module.exports = publish