const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const rimraf = require('rimraf')
const { rmDir } = require('../utils/utils')
const currentDir = process.cwd()

class PublistCommand {
  constructor(){
    this.templatePath = ''
    this.packageConfig = {}
    this.ignores = ['node_modules/**','dist/**','dist-ssr/**','.bootstrap/**','.vscode/**','.DS_Store/**','.git/**']
    this.initTemplate()
  }

  async initTemplate(){
    await this.packageBuild()
    await this.createTemplateDir()
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
    const templateDir = `_template_${this.packageConfig.version}_`
    this.templatePath = path.join(currentDir, templateDir)
    await rmDir(this.templatePath)
    // if(fs.existsSync(this.templatePath)){
      // 删除文件
      // execSync(`rm -rf ${templateDir}`, {
      //   cwd: currentDir
      // })
      // console.log('存在')
      // await rimraf(templateDir, function(error){
      //   console.log(error)
      // })
      // await rmDir(this.templatePath)
      // fs.rmdir(this.templatePath,function(error){
      //   console.log('运行')
      //   console.log(error)
      //   console.log('删除成功');
      // })
    // }
    // try{
    //   fs.mkdirSync(templateDir)
    //   fs.mkdirSync(path.join(this.templatePath, 'template'))
    // }catch(error){
    //   return Promise.reject(error)
    // }
  }
}

function publish(){
  return new PublistCommand()
}

module.exports = publish