// 命令行交互工具
const inquirer = require('inquirer')
// 集成了fs，拓展。文件操作
const fse = require('fs-extra')
const { isEmptyDir, sleep, spinnerStart } = require('../utils/utils')
const axios = require('axios')
const Command = require('../category/Command')
const log = require('../utils/log')
const userHome = require('user-home')
const path = require('path')
const Package = require('../category/Package')

class CreateCommand extends Command {
    init(){
        //npm上的模板包列表
        this.npmList = []
        //当前选择的项目模板名称
        this.templateName = '' 
        // 用户输入的基本项目信息
        this.projectInfo = {
            dirName: this._argv[0]
        }
    }
    // 执行开始
    async exec (){
        try{
            // 准备阶段
            await this.prepare()
            log.info('projectInfo', this.projectInfo)
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
        await this.getAllTemplate()
        await this.iniProject()
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
        this.templateName = templateName
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
        if(!validName(this.projectInfo.dirName) || !this.projectInfo.dirName){
            promptList.unshift({
                type: 'input',
                name: 'dirName',
                default: '',
                message: '请输入项目名称',
                validate: function(e){
                    const done = this.async()
                    setTimeout(function(){
                        if(!validName(e)){
                            done(`请输入合法的项目名称`)
                            return
                        }
                        return done(null, true)
                    }, 0)
                }
            })
        }

        //初始化项目信息
        const {dirName, projectDesc} = await inquirer.prompt(promptList)
        dirName && (this.projectInfo.dirName = dirName)
        Object.assign(this.projectInfo, {
            projectName: this.formatProjectName(),
            description: projectDesc,
            templateName: this.templateName,
            projectVersion:'1.0.0'
        })
    }

    /**
	 * 
	 * @param {*} dirName 文件夹名称 
	 * @returns 项目名称
	 */
    formatProjectName(){
        const nameArr = this.projectInfo.dirName.split(/(?=[A-z])/)
		let name = nameArr.join('-').toLowerCase()
		name = name.split('-')
		name = name.filter(e => e)
		name = name.join('-')
        return name
    }
    
    // 下载项目模板
    async downloadTemplate(){
        const { templateName } = this.projectInfo
        const { version } = this.npmList.find(e=>e.name === templateName)
        const targetPath = path.resolve(userHome, '.haha-cli', 'template')
        const storePath = path.resolve(userHome, '.haha-cli', 'template', 'node_modules')
        const templatePack= new Package({
            targetPath,
			storePath,
			pkgName: templateName,
			pkgVersion: version
        })
        console.log('templatePack',templatePack)
        if(!await templatePack.exists()){
            const spinner = spinnerStart('正在下载模板...')
            await sleep()
            try{
                await templatePack.install()
            }catch(error){
                throw error
            } finally {
                spinner.stop()
                if( await templatePack.exists()){
                    console.log('\n')
					log.success('下载成功')
					this.packageInfo = templatePack
                }
            }
        } else {
            
        }
    }
}

function create(){
    const argv = Array.from(arguments)
    return new CreateCommand(argv)
}

module.exports = create
module.exports.CreateCommand = CreateCommand