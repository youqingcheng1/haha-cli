// 命令行交互工具
const inquirer = require('inquirer')
// 集成了fs，拓展。文件操作
const fse = require('fs-extra')
const { isEmptyDir } = require('../utils/utils')
const axios = require('axios')

class CommandInit {
    constructor(){
        //npm上的模板包列表
        this.npmList = []
        //当前选择的项目模板名称
        this.currentTtemplateName = '' 
    }
    async start (){
        try{
            // 准备阶段
            await this.prepare()
            await this.downloadTemplate()
        }catch(e){
            console.log(e)
        }
    } 
    
    async prepare(){
        // 当前目录是否为空
        const isEmpty = isEmptyDir()
        let isContinue = false
        if (!isEmpty) {
            isContinue = (
                await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'isContinue',
                        default: false,
                        message: '当前文件夹不为空，是否继续创建项目？'
                    }
                ])).isContinue
            if (!isContinue) {
                process.exit(1)
            }
            if (isContinue) {
                const { isClear } = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'isClear',
                            default: false,
                            message: '是否清空文件夹？'
                        }
                    ])
                    if (isClear) {
                        fse.emptyDirSync(process.cwd())
                    }
            }
        }
        this.getAllTemplate()
    }
    
    //选择模板
    async getAllTemplate(){
        const { data } = await axios.get('http://10.0.0.208:4873/-/verdaccio/data/packages')
        this.npmList = data || []
        const templateALl = this.npmList.map(r => ({name:r.name, value:r.name})).filter(e => /^\@template/.test(e.name))
        const { templateName } = await inquirer.prompt([
            {
                type: 'list',
                message: '请选择项目模板',
                name: 'templateName',
                default: templateALl[0].value,
                choices: templateALl
            }
        ])
        this.currentTtemplateName = templateName
    }
    
    //初始化项目
    async iniProject() {
        const validName = (e) => /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(e)
        const promptList = [{
            type: 'input',
            name: 'projectDesc',
            message: '请输入项目描述',
            validate: function(e){
                const done = this.async()
                setTimeout(()=>{
                    if(!e) {
                        done('请输入项目描述')
                        return
                    }
                    return done(null, true)
                })
            }
        }]
        // 判断项目名称是否合法
        // if(!validName(this.projectInfo.dirName))
    }
    
    // 下载模板
    async downloadTemplate (){}
}

module.exports = new CommandInit()