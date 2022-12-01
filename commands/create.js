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
const glob = require('glob')
// 嵌入式 JavaScript 模板
const ejs = require('ejs');
const { CLI_STORE_PKGNAME } = global

class CreateCommand extends Command {
    init(){
        //npm上的模板包列表
        this.npmList = []
        //当前选择的项目模板名称
        this.templateName = '' 
        // 用户输入的基本项目信息
        this.projectInfo = {
            dirName: this._argv[0],
            projectName: this._argv[0]
        },
        // 用户选择的模板包基本信息
		this.packageInfo = {}
    }
    // 执行开始
    async exec (){
        try{
            // 准备阶段
            await this.prepare()
            // 下载模板
            await this.downloadTemplate()
            // 获取模板必要的渲染字段
            await this.getPkgMustFiled()
            // 将下载的项目模板copy到当前项目目录
            await this.templateMove()
        }catch(e){
            log.error(e)
        }
    } 
    
    async prepare(){
        // 当前目录是否为空
        const isEmpty = isEmptyDir()
        let isContinue = false
        if (!isEmpty) {
            isContinue = (
            await inquirer.prompt([{
                    type: 'confirm',
                    name: 'isContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                }
            ])).isContinue
            if (!isContinue) {
                // 结束进程
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
        const { data } = await axios.get(CLI_NPM_API_PKGLIST)
        this.npmList = data || []
        const reg = new RegExp('^' + CLI_STORE_PKGNAME + '')
        const templateALl = this.npmList.map(r => ({name:r.name, value:r.name})).filter(e => reg.test(e.name))
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
        // 判断项目名称是否合法
        const promptList = [{
            type: 'input',
            name: 'projectDesc',
            message: '请输入项目描述',
            validate: function(e){
                const done = this.async()
                setTimeout(()=>{
                    if(!e) { done('请输入项目描述'); return}
                    return done(null, true)
                })
            }
        }]
        if(!validName(this.projectInfo.dirName) || !this.projectInfo.dirName){
            promptList.unshift({
                type: 'input',
                name: 'dirName',
                default: '',
                message: '请输入项目名称',
                validate: function(e){
                    const done = this.async()
                    setTimeout(function(){
                        if(!validName(e)){done(`请输入合法的项目名称`);return}
                        return done(null, true)
                    }, 0)
                }
            })
        }

        //初始化项目信息
        const { dirName, projectDesc } = await inquirer.prompt(promptList)
        dirName && (this.projectInfo.dirName = dirName)
        Object.assign(this.projectInfo, {
            projectName: this.projectInfo.dirName,
            description: projectDesc,
            templateName: this.templateName,
            projectVersion: '1.0.0'
        })
    }
    
    // 下载项目模板
    async downloadTemplate(){
        const { templateName } = this.projectInfo
        const { version } = this.npmList.find(e=>e.name === templateName)
        const targetPath = path.resolve(userHome, '.haha-cli', 'template')
        const storePath = path.resolve(userHome, '.haha-cli','template','node_modules')
        const templatePack= new Package({
            targetPath,
			storePath,
			pkgName: templateName,
			pkgVersion: version
        })
        console.log('----templateInfo',templatePack)
        if(!await templatePack.exists()){
            const spinner = spinnerStart('正在下载模板...')
            await sleep()
            try{
                await templatePack.install()
            }catch(error){
                throw error
            } finally {
                spinner.stop()
                if(await templatePack.exists()){
                    console.log('\n')
					log.success('下载成功')
                }
            }
        } else {
            const spinner = spinnerStart('正在更新模板...')
            await sleep()
            try{
                await templatePack.update()
            }catch(error){
                throw error
            } finally {
                spinner.stop()
                if(await templatePack.exists()){
                    console.log('\n')
                    log.success('更新成功')
                }
            }
        }

        this.packageInfo = templatePack
    }

    // copy 模板到指定项目
    async templateMove(){
        const spinner = spinnerStart('正在安装项目模板')
        await sleep()
        const templatePath = path.join(this.packageInfo.cacheFilePath, 'template')
        const projectPath = path.join(process.cwd(), this.projectInfo.dirName)
        fse.ensureDirSync(templatePath)
        fse.ensureDirSync(projectPath)
        fse.copySync(templatePath, projectPath)
        spinner.stop(true)
        console.log('---projectInfo',this.projectInfo)
        await this.ejsRender(projectPath)
        log.success('模板安装完成')
    }

    // 渲染ejs
    ejsRender(dir) {
        return new Promise((resolve, reject)=>{
            glob('**', { cwd: dir, nodir: true}, (err,files) => {
                err && reject(err)
                Promise.all(files.map(file=>{
                    const filePath = path.join(dir, file)
                    return new Promise(async (res, rej)=> {
                        try{
                            await this.renderFile(filePath, this.projectInfo, true)
                            res(true);
                        }catch(err){
                            rej(err)
                        }
                    })
                })).then(()=>{
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    // 写入模板，把esj模板转成正常文件
    renderFile(filePath, options, diableFormatDotFile){
        // path.basename() 方法会返回 path 的最后一部分
        let fileName = path.basename(filePath)
        // path.extname 返回path路径文件扩展名 file.html =>.html
        const extName = path.extname(fileName)
        let excloudFile = ['.js', '.json']
        if(!excloudFile.includes(extName)) return Promise.resolve()
        return new Promise((resolve, reject) => {
            ejs.renderFile(filePath, options, (err, result)=>{
                if(err) return reject(err)
                if(/^_package.json/.test(fileName)){
                    fileName = fileName.replace('_package.json', 'package.json');
                    fse.removeSync(filePath)
                }
                if (/\.ejs$/.test(filePath)) {
                    fileName = fileName.replace(/\.ejs$/, '');
                    fse.removeSync(filePath);
                }
                if (!diableFormatDotFile && /^_/.test(fileName)) {
                    fileName = fileName.replace(/^_/, '.');
                    fse.removeSync(filePath);
                }
                const newFilepath = path.join(filePath, '../', fileName);
                fse.writeFileSync(newFilepath, result);
                resolve(newFilepath);
            })
        })
    }

    // 获取项目模板内置的渲染字段定义
    async getPkgMustFiled(){
        const promptList = this.createPromptList()
        let result = {}
        if(promptList.length) {
            result = await inquirer.prompt(promptList)
        }
        this.projectInfo = {
            ...this.projectInfo,
			...result
        }
    }

    // 生成项目模板渲染字段命令行对话框
    createPromptList(){
        const pkgPath = this.packageInfo.cacheFilePath
        const pkg = require(path.join(pkgPath, 'package.json'))
        const renderInfo = pkg.renderInfo || []
        if( !renderInfo.length) return []
        const promptList = {
            type: 'input',
            name: '',
            default: '',
            message: '',
            validate: function(e){
                const done = this.async()
                setTimeout(function () {
                    if(!e.length){
                        done(`${this.message}`)
                        return
                    }
                    return done(null, true)
                }, 0)
            }
        }
        return renderInfo.map(item => ({...promptList, name: e.code, message: `请输入${e.desc}`}))
    }
}

function create(){
    const argv = Array.from(arguments)
    return new CreateCommand(argv)
}

module.exports = create